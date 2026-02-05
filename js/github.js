/* git log */

const USERNAME = "lpuv"; // Change this if needed

async function fetchGitActivity() {
    const logListEl = document.getElementById("git-log-list");
    const userEl = document.getElementById("git-username");
    
    if (!logListEl) return;
    
    userEl.innerText = USERNAME.toUpperCase();

    // 1. Clear old cache (We rely on Vercel caching now mostly)
    const cacheKey = "git_activity_cache";
    localStorage.removeItem(cacheKey);

    try {
        // --- CHANGE 1: Call your own API ---
        const response = await fetch(`/api/github-api?username=${USERNAME}`);
        if (!response.ok) throw new Error("API Error");
        const events = await response.json();

        // Process
        logListEl.innerHTML = ""; 
        
        if (events.length === 0) {
            logListEl.innerHTML = "<li>NO RECENT ACTIVITY</li>";
            return;
        }
        
        console.log("Processing", events.length, "events");
        
        // Add events sequentially with a delay
        for (let i = 0; i < events.length; i++) {
            setTimeout(() => {
                const event = events[i];
                const li = document.createElement("li");
                li.style.opacity = "0";
                li.style.transition = "opacity 0.3s ease-in";
                
                // Format the date
                const date = new Date(event.created_at);
                const diffDays = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
                const timeStr = diffDays === 0 ? "today" : `${diffDays}d ago`;
                
                let actionHTML = "";
                // Safety check: ensure repo name exists
                const repo = event.repo ? event.repo.name.split('/')[1] : "unknown"; 
                
                if (event.type === "PushEvent") {
                    const commitSha = event.payload.head;
                    const shortSha = commitSha.substring(0, 7);
                    const repoFullName = event.repo.name;
                    const commitUrl = `https://github.com/${repoFullName}/commit/${commitSha}`;
                    
                    // --- CHANGE 2: Read the pre-fetched data ---
                    // The backend put the message and stats in '_enriched'
                    if (event._enriched) {
                        const message = event._enriched.message;
                        const stats = event._enriched.stats;
                        
                        let statsStr = "";
                        if (stats) {
                            statsStr = ` <span style="color: #4a9eff;">(+${stats.additions}</span> <span style="color: #f85149;">-${stats.deletions})</span>`;
                        }
                        
                        actionHTML = `[PUSH] <b>${repo}</b> <a href="${commitUrl}" target="_blank">${shortSha}</a>: ${message}${statsStr}`;
                    } else {
                        // Fallback if backend couldn't get details
                        const count = event.payload.size || 1;
                        actionHTML = `[PUSH] <b>${repo}</b>: <a href="${commitUrl}" target="_blank">${shortSha}</a> (${count} commits)`;
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
                
                // Fade in and scroll
                setTimeout(() => {
                    li.style.opacity = "1";
                    logListEl.scrollTop = logListEl.scrollHeight;
                }, 10);
            }, i * 150);
        }

    } catch (err) {
        console.error(err);
        logListEl.innerHTML = "<li style='color: #f44;'>[ERROR] API UNAVAILABLE</li>";
    }
}

fetchGitActivity();