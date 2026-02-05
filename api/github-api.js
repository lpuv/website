// api/github.js
export default async function handler(req, res) {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ error: 'Username required' });
    }

    const token = process.env.GITHUB_KEY;
    
    // Helper to fetch with your token
    const fetchGitHub = async (url) => {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        if (!response.ok) throw new Error(`GitHub Error: ${response.status}`);
        return response.json();
    };

    try {
        // 1. Get the list of events
        const events = await fetchGitHub(`https://api.github.com/users/${username}/events`);
        
        // 2. Filter to top 10 to save resources
        const recentEvents = events.slice(0, 10);

        // 3. "Hydrate" the events (Fetch extra details for Pushes)
        // We use Promise.all to fetch them all in parallel, which is super fast
        const enrichedEvents = await Promise.all(recentEvents.map(async (event) => {
            
            // We only need extra data if it's a PushEvent
            if (event.type === 'PushEvent' && event.payload.commits.length > 0) {
                try {
                    const repoName = event.repo.name;
                    const commitSha = event.payload.head;
                    
                    // Fetch the specific commit details
                    const commitData = await fetchGitHub(`https://api.github.com/repos/${repoName}/commits/${commitSha}`);
                    
                    // Attach the cool stats to the event object
                    return {
                        ...event,
                        _enriched: {
                            message: commitData.commit.message.split('\n')[0], // First line only
                            stats: commitData.stats // { additions: 10, deletions: 2 }
                        }
                    };
                } catch (err) {
                    console.error(`Failed to fetch commit for ${event.id}:`, err);
                    // If it fails, return the event as-is without extra data
                    return event;
                }
            }
            
            // If not a push, just return the event as-is
            return event;
        }));

        // 4. Cache for 5 minutes (300 seconds)
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
        
        return res.status(200).json(enrichedEvents);

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}