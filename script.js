const el = document.getElementById("typewriter");
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let phraseIndex = 0;

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


