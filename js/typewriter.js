// Typewriter effect for the tagline

const el = document.getElementById("typewriter");
let phraseIndex = 0;

// Import the sleep function (will be available via utils.js)
const sleep = (ms) => {
    return new Promise(resolve => {
        const checkPause = () => {
            if (window.isNewsActive) {
                setTimeout(checkPause, 100); 
            } else {
                setTimeout(resolve, ms);
            }
        };
        checkPause();
    });
};


const writeLoop = async () => {
    shuffle(phrases);
    while (true) {
        let curWord = phrases[phraseIndex];
        
        for (let i = 0; i < curWord.length; i++) {
            el.innerText = curWord.substring(0, i + 1);
            await sleep(75);
        }

        await sleep(2500);

        for (let i = curWord.length; i > 0; i--) {
            el.innerText = curWord.substring(0, i - 1);
            await sleep(50);
        }

        await sleep(1000);

        phraseIndex++;
        if (phraseIndex >= phrases.length) {
            phraseIndex = 0;
        }
    }
};

// Start the typewriter
writeLoop();
