/* git log */

const USERNAME = "lpuv";


async function fetchGitActivity() {
    const logListEl = document.getElementById("git-log-list");
    const userEl = document.getElementById("git-username");
    
    if (!logListEl) {
        console.error("Could not find git-log-list element");
        return;
    }
    
    userEl.innerText = USERNAME.toUpperCase();

    // 1. clear old format cache
    const cacheKey = "git_activity_cache";
    localStorage.removeItem(cacheKey);

    try {
        // fetch events
        const response = await fetch(`https://api.github.com/users/${USERNAME}/events`);
        if (!response.ok) throw new Error("API Error");
        const events = await response.json();

        // process
        logListEl.innerHTML = ""; // Clear "Initializing"
        
        if (events.length === 0) {
            logListEl.innerHTML = "<li>NO RECENT ACTIVITY</li>";
            return;
        }
        
        const recentEvents = events.slice(0, 10); // Get last 10
        console.log("Processing", recentEvents.length, "events");
        
        // Add events sequentially with a delay
        for (let i = 0; i < recentEvents.length; i++) {
            setTimeout(async () => {
                const event = recentEvents[i];
                const li = document.createElement("li");
                li.style.opacity = "0";
                li.style.transition = "opacity 0.3s ease-in";
                
                // Format the date (e.g., "2d ago")
                const date = new Date(event.created_at);
                const diffDays = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
                const timeStr = diffDays === 0 ? "today" : `${diffDays}d ago`;
                
                // Format the action based on type
                let actionHTML = "";
                const repo = event.repo.name.split('/')[1]; // Remove username from repo
                
                if (event.type === "PushEvent") {
                    const count = event.payload.size || 1;
                    const commitSha = event.payload.head;
                    const shortSha = commitSha.substring(0, 7);
                    const repoFullName = event.repo.name;
                    
                    // Try to fetch commit message and stats
                    try {
                        const commitResponse = await fetch(`https://api.github.com/repos/${repoFullName}/commits/${commitSha}`);
                        if (commitResponse.ok) {
                            const commitData = await commitResponse.json();
                            const message = commitData.commit.message.split('\n')[0]; // First line only
                            const commitUrl = `https://github.com/${repoFullName}/commit/${commitSha}`;
                            
                            // Get stats if available
                            const stats = commitData.stats;
                            let statsStr = "";
                            if (stats) {
                                const additions = stats.additions;
                                const deletions = stats.deletions;
                                statsStr = ` <span style="color: #4a9eff;">(+${additions}</span> <span style="color: #f85149;">-${deletions})</span>`;
                            }
                            
                            actionHTML = `[PUSH] <b>${repo}</b> <a href="${commitUrl}" target="_blank">${shortSha}</a>: ${message}${statsStr}`;
                        } else {
                            // Fallback without message
                            const commitUrl = `https://github.com/${repoFullName}/commit/${commitSha}`;
                            actionHTML = `[PUSH] <b>${repo}</b>: <a href="${commitUrl}" target="_blank">${shortSha}</a> (${count} commit${count > 1 ? 's' : ''})`;
                        }
                    } catch (e) {
                        // Fallback without link
                        actionHTML = `[PUSH] <b>${repo}</b>: ${count} commit${count > 1 ? 's' : ''}`;
                    }
                } else if (event.type === "CreateEvent") {
                    actionHTML = `[NEW] Created ${event.payload.ref_type} in <b>${repo}</b>`;
                } else if (event.type === "WatchEvent") {
                    actionHTML = `[STAR] Starred <b>${repo}</b>`;
                } else if (event.type === "IssuesEvent") {
                    actionHTML = `[ISSUE] ${event.payload.action} in <b>${repo}</b>`;
                } else if (event.type === "PullRequestEvent") {
                    actionHTML = `[PR] ${event.payload.action} in <b>${repo}</b>`;
                } else {
                    actionHTML = `[ACT] ${event.type.replace('Event','')} on <b>${repo}</b>`;
                }
            
                li.innerHTML = `<span style="opacity:0.5; margin-right:5px;">${timeStr}</span> ${actionHTML}`;
                logListEl.appendChild(li);
                
                // Fade in and scroll to bottom
                setTimeout(() => {
                    li.style.opacity = "1";
                    logListEl.scrollTop = logListEl.scrollHeight;
                }, 10);
            }, i * 150); // 150ms delay between each entry
        }

        // save to cache
        localStorage.setItem(cacheKey, JSON.stringify({
            timestamp: Date.now(),
            logHTML: logListEl.innerHTML
        }));

    } catch (err) {
        console.error(err);
        logListEl.innerHTML = "<li style='color: #f44;'>[ERROR] API UNAVAILABLE</li>";
    }
}

// Run it
fetchGitActivity();