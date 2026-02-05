// api/github.js

// simple in-memory rate limiter
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 10; // Max requests per window

function checkRateLimit(ip) {
    const now = Date.now();
    const userRequests = rateLimitMap.get(ip) || [];
    
    // Remove old requests outside the window
    const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
    
    if (recentRequests.length >= MAX_REQUESTS) {
        return false; // Rate limit exceeded
    }
    
    recentRequests.push(now);
    rateLimitMap.set(ip, recentRequests);
    
    // Cleanup old entries periodically
    if (Math.random() < 0.01) { // 1% chance
        for (const [key, value] of rateLimitMap.entries()) {
            if (value.every(time => now - time > RATE_LIMIT_WINDOW)) {
                rateLimitMap.delete(key);
            }
        }
    }
    
    return true;
}

export default async function handler(req, res) {
    // Check origin header to prevent abuse from browsers
    const origin = req.headers.origin || req.headers.referer;
    const allowedOrigins = [
        'https://craftcat.dev',
        'https://www.craftcat.dev',
        'http://localhost',
        'http://127.0.0.1'
    ];
    
    if (origin && !allowedOrigins.some(allowed => origin.startsWith(allowed))) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Get client IP for rate limiting
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || 
               req.headers['x-real-ip'] || 
               req.socket.remoteAddress;
    
    // Rate limiting as backup defense
    if (!checkRateLimit(ip)) {
        return res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });
    }
    
    const { username } = req.query;

    if (!username) return res.status(400).json({ error: 'Username required' });

    const token = process.env.GITHUB_KEY;
    
    const fetchGitHub = async (url) => {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28' // Good practice to lock version
            }
        });
        if (!response.ok) {
            // Log error internally but don't crash the request yet
            console.error(`GitHub API Error: ${response.status} ${response.statusText}`);
            return null; // Return null so we can handle it gracefully
        }
        return response.json();
    };

    try {
        const events = await fetchGitHub(`https://api.github.com/users/${username}/events`);
        
        // If the token is totally broken (401/403), 'events' will be null.
        if (!events || !Array.isArray(events)) {
            return res.status(500).json({ error: "Failed to fetch events. Check Token Permissions." });
        }

        const recentEvents = events.slice(0, 10);

        const enrichedEvents = await Promise.all(recentEvents.map(async (event) => {
            
            // Enrich PushEvents with commit details
            if (event.type === 'PushEvent' && event.payload.head) {
                try {
                    const repoName = event.repo.name;
                    const commitSha = event.payload.head;
                    
                    const commitData = await fetchGitHub(`https://api.github.com/repos/${repoName}/commits/${commitSha}`);
                    
                    if (commitData && commitData.commit) {
                        return {
                            ...event,
                            _enriched: {
                                message: commitData.commit.message.split('\n')[0],
                                stats: commitData.stats
                            }
                        };
                    }
                } catch (err) {
                    console.error(`Failed to enrich event ${event.id}`, err);
                }
            }
            
            return event;
        }));

        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
        return res.status(200).json(enrichedEvents);

    } catch (error) {
        console.error("Backend Crash:", error);
        return res.status(500).json({ error: error.message });
    }
}