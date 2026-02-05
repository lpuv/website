// api/github.js
export default async function handler(req, res) {
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
            
            // Some events (like branch creation) have an empty payload.
            if (event.type === 'PushEvent' && event.payload.commits?.length > 0) {
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