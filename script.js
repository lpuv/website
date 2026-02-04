const el = document.getElementById("typewriter");

let phraseIndex = 0;
let bulbBroken = false;
let isNewsActive = false;

// Updated sleep function that pauses during news alerts
const sleep = (ms) => {
    return new Promise(resolve => {
        const checkPause = () => {
            if (isNewsActive) {
                // If news is playing, check again in 100ms (Loop)
                setTimeout(checkPause, 100); 
            } else {
                // If clear, wait the requested time, then finish
                setTimeout(resolve, ms);
            }
        };
        checkPause();
    });
};

function shuffle(array) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
}


const writeLoop = async () => {
    shuffle(phrases);
    while (true) {
        let curWord = phrases[phraseIndex];
        
        // 1. Type the word
        for (let i = 0; i < curWord.length; i++) {
            el.innerText = curWord.substring(0, i + 1);
            await sleep(75); // Typing speed (milliseconds)
        }

        // 2. Wait after typing
        await sleep(2500); // How long to stay on the word

        // 3. Backspace the word
        for (let i = curWord.length; i > 0; i--) {
            el.innerText = curWord.substring(0, i - 1);
            await sleep(50); // Backspace speed (faster than typing)
        }

        // 4. Wait before next word
        await sleep(500);

        // 5. Switch to next phrase
        phraseIndex++;
        if (phraseIndex >= phrases.length) {
            phraseIndex = 0;
        }
    }
};

writeLoop();



// spinning (why not)
let inputBuffer = "";

document.addEventListener("keydown", (e) => {
    inputBuffer += e.key.toLowerCase();

    // Keep buffer short so it doesn't consume memory
    if (inputBuffer.length > 20) inputBuffer = inputBuffer.slice(-20);


    if (inputBuffer.endsWith("spin")) {
        // Find the main element and spin it
        const mainElement = document.querySelector("main");
        
        // We use a CSS class to handle the animation
        mainElement.classList.add("barrel-roll");
        
        // Remove the class after it finishes so they can do it again
        setTimeout(() => {
            mainElement.classList.remove("barrel-roll");
        }, 1000);
    } else if (inputBuffer.endsWith("nips")) {
        const mainElement = document.querySelector("main");
        mainElement.classList.add("barrel-roll-backwards");
        setTimeout(() => {
            mainElement.classList.remove("barrel-roll-backwards");
        }, 1000);
    }
});


const lightBtn = document.getElementById("light-mode-btn");

lightBtn.addEventListener("click", () => {
    // 1. Trigger the CSS animation
    document.body.classList.add("flickering-overlay");
    lightBtn.innerText = "IGNITING...";
    lightBtn.disabled = true; // Prevent spamming clicks while flickering

    // 2. Wait 1.5 seconds (1500ms) for the animation to finish
    setTimeout(() => {
        // Remove the class to ensure it stays dark cleanly
        document.body.classList.remove("flickering-overlay");
        
        // 3. Show the "Broken" message
        lightBtn.innerText = "[ ERROR: BULB BURNT OUT ]";
        bulbBroken = true;
        lightBtn.style.color = "#555"; // Make the text look dim/disabled
        lightBtn.style.textDecoration = "line-through";
        lightBtn.style.cursor = "not-allowed";
    }, 1500);
});

lightBtn.addEventListener("mouseover", () => {
    if (bulbBroken) {
        lightBtn.title = "You want to try it again? What are you, a masochist?";
    } else {
        lightBtn.title = "Warning: May cause temporary blindness.";
    }
});


/* Ticker Code */

const wrap = document.querySelector(".ticker-wrap");
const tickerText = document.getElementById("ticker-text");

function showBreakingNews() {
    isNewsActive = true; // Set the pause flag

    const headline = tickerLibrary[Math.floor(Math.random() * tickerLibrary.length)];
    tickerText.innerText = headline;

    // Calculate animation speed based on text length
    // (Longer text needs more time to scroll across)
    const duration = 5 + (headline.length / 5); 
    tickerText.style.animationDuration = `${duration}s`;

    // Pop up the bar
    wrap.classList.add("active");

    // Start the scroll animation
    // We remove the class first to reset it if it was already there
    tickerText.classList.remove("scroll-across");
    void tickerText.offsetWidth; // Trigger a "Reflow" (Force browser to restart animation)
    tickerText.classList.add("scroll-across");

    // Cleanup after animation finishes
    setTimeout(() => {
        wrap.classList.remove("active"); // Drop the bar down

        isNewsActive = false; // Clear the pause flag
        
        // Schedule the NEXT news alert (Random time between 10s and 40s)
        const nextTime = Math.random() * 30000 + 10000;
        setTimeout(showBreakingNews, nextTime);
        
    }, duration * 1000 + 500); // Wait for animation + 0.5s buffer
}

// Start the first loop after a short delay
setTimeout(showBreakingNews, 5000);