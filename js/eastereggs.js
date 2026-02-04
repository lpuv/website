// Easter eggs and keyboard shortcuts

let inputBuffer = "";

document.addEventListener("keydown", (e) => {
    inputBuffer += e.key.toLowerCase();

    // Keep buffer short so it doesn't consume memory
    if (inputBuffer.length > 20) inputBuffer = inputBuffer.slice(-20);

    if (inputBuffer.endsWith("spin")) {
        const mainElement = document.querySelector("main");
        mainElement.classList.add("barrel-roll");
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
