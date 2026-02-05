
// christmas
let isChristmas = false;
const now = new Date();
if (now.getMonth() === 11 && now.getDate() >= 24 && now.getDate() <= 26) {
    isChristmas = true;
}

let tooSmallScreen = false;
let isCollapsed = false;
// check if screen too small
if (window.innerWidth < 768) {
    tooSmallScreen = true;
    isCollapsed = true;
}

addEventListener("resize", () => {
    if (window.innerWidth < 768) {
        tooSmallScreen = true;
        isCollapsed = true;
    } else {
        tooSmallScreen = false;
    }
});

// pseudo-random number generator (sfc32) for consistent shuffling
function sfc32(a, b, c, d) {
  return function() {
    a |= 0; b |= 0; c |= 0; d |= 0;
    let t = (a + b | 0) + d | 0;
    d = d + 1 | 0;
    a = b ^ b >>> 9;
    b = c + (c << 3) | 0;
    c = (c << 21 | c >>> 11);
    c = c + t | 0;
    return (t >>> 0) / 4294967296;
  }
}



const seedgen = () => (Math.random()*2**32)>>>0;
const getRand = sfc32(seedgen(), seedgen(), seedgen(), seedgen());

function shuffle(array) {
    let currentIndex = array.length;
    while (currentIndex != 0) {
        let randomIndex = Math.floor(getRand() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
}


var touchDevice = ('ontouchstart' in document.documentElement);
