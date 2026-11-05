// Vercel function: proxies the GitHub events API with a token so the
// browser never hits the unauthenticated 60 req/hr limit.

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000;
const MAX_REQUESTS = 10;

function checkRateLimit(ip) {
  const now = Date.now();
  const userRequests = rateLimitMap.get(ip) || [];
  const recentRequests = userRequests.filter((time) => now - time < RATE_LIMIT_WINDOW);

  if (recentRequests.length >= MAX_REQUESTS) return false;

  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);

  if (Math.random() < 0.01) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.every((time) => now - time > RATE_LIMIT_WINDOW)) {
        rateLimitMap.delete(key);
      }
    }
  }

  return true;
}

export default async function handler(req, res) {
  // The referer includes a path and trailing slash, so compare parsed origins,
  // not raw header strings. Otherwise Vercel previews get a 403.
  const rawOrigin = req.headers.origin || req.headers.referer;
  let origin = '';
  try {
    origin = new URL(rawOrigin).origin;
  } catch {
    origin = '';
  }

  const allowedOrigins = [
    'https://craftcat.dev',
    'https://www.craftcat.dev',
    'http://localhost',
    'http://127.0.0.1',
  ];
  const isVercelPreview = /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin);

  if (
    origin &&
    !isVercelPreview &&
    !allowedOrigins.some((allowed) => origin === allowed || origin.startsWith(`${allowed}:`))
  ) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const ip =
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.socket.remoteAddress;

  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });
  }

  // Personal-site proxy, not a general GitHub API. Ignore the query param so
  // this cannot be used to spend the token on arbitrary users.
  const username = 'lpuv';

  const token = process.env.GITHUB_KEY;

  const fetchGitHub = async (url) => {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (!response.ok) {
      console.error(`GitHub API Error: ${response.status} ${response.statusText}`);
      return null;
    }
    return response.json();
  };

  try {
    const events = await fetchGitHub(`https://api.github.com/users/${username}/events`);

    if (!events || !Array.isArray(events)) {
      return res.status(500).json({ error: 'Failed to fetch events. Check token permissions.' });
    }

    const recentEvents = events.slice(0, 10);

    const enrichedEvents = await Promise.all(
      recentEvents.map(async (event) => {
        if (event.type === 'PushEvent' && event.payload.head) {
          try {
            const repoName = event.repo.name;
            const commitSha = event.payload.head;
            const commitData = await fetchGitHub(
              `https://api.github.com/repos/${repoName}/commits/${commitSha}`,
            );

            if (commitData && commitData.commit) {
              return {
                ...event,
                _enriched: {
                  message: commitData.commit.message.split('\n')[0],
                  stats: commitData.stats,
                },
              };
            }
          } catch (err) {
            console.error(`Failed to enrich event ${event.id}`, err);
          }
        }

        return event;
      }),
    );

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).json(enrichedEvents);
  } catch (error) {
    console.error('Backend crash:', error);
    return res.status(500).json({ error: error.message });
  }
}
