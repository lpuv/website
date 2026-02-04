// News ticker functionality

// Global flag to pause typewriter during news
window.isNewsActive = false;

const wrap = document.querySelector(".ticker-wrap");
const tickerText = document.getElementById("ticker-text");

function showBreakingNews() {
    window.isNewsActive = true;

    shuffle(tickerLibrary);

    const headline = tickerLibrary[Math.floor(Math.random() * tickerLibrary.length)];
    tickerText.innerText = headline;

    // Calculate animation speed based on text length
    const duration = 5 + (headline.length / 5); 
    tickerText.style.animationDuration = `${duration}s`;

    // Pop up the bar
    wrap.classList.add("active");

    // Start the scroll animation
    tickerText.classList.remove("scroll-across");
    void tickerText.offsetWidth; // Trigger reflow
    tickerText.classList.add("scroll-across");

    // Cleanup after animation finishes
    setTimeout(() => {
        wrap.classList.remove("active");
        window.isNewsActive = false;
        
        // Schedule the next news alert (Random time between 10s and 40s)
        const nextTime = Math.random() * 30000 + 10000;
        setTimeout(showBreakingNews, nextTime);
        
    }, duration * 1000 + 500);
}

// Start the first loop after a short delay
setTimeout(showBreakingNews, 10000);
