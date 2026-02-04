// Version display functionality

const actualVersion = "1.4";
const verEl = document.querySelector(".version-display");
const buildNum = Math.floor(Math.random() * 999);

verEl.innerText = `SYS.VER.${actualVersion}.${buildNum}`;

verEl.addEventListener("click", () => {
    verEl.innerText = `Current Build: SYS.VER.${actualVersion}.${buildNum}\nAll systems nominal. No known bugs. Everything is fine.`;
    setTimeout(() => {
        verEl.innerText = `SYS.VER.${actualVersion}.${buildNum}`;
    }, 2000);
});
