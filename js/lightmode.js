// Light mode button functionality

let bulbBroken = false;
const lightBtn = document.getElementById("light-mode-btn");

lightBtn.addEventListener("click", () => {
    // trigger css animation
    document.body.classList.add("flickering-overlay");
    lightBtn.innerText = "IGNITING...";
    lightBtn.disabled = true;

    // wait for animation to finish
    setTimeout(() => {
        document.body.classList.remove("flickering-overlay");
        
        lightBtn.innerText = "[ ERROR: BULB BURNT OUT ]";
        bulbBroken = true;
        lightBtn.style.color = "#555";
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

lightBtn.addEventListener("mouseout", () => {
    lightBtn.title = "";
});
