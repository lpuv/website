const el = document.getElementById("typewriter");

let phraseIndex = 0;
let bulbBroken = false;
let isNewsActive = false;
let actualVersion = "1.3";

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
        
        for (let i = 0; i < curWord.length; i++) {
            el.innerText = curWord.substring(0, i + 1);
            await sleep(75); // Typing speed
        }

        // wait
        await sleep(2500);

        // backspace
        for (let i = curWord.length; i > 0; i--) {
            el.innerText = curWord.substring(0, i - 1);
            await sleep(50); // Backspace speed (faster than typing)
        }

        // wait a bit
        await sleep(1000);

        // next phrase
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
    // trigger css animation
    document.body.classList.add("flickering-overlay");
    lightBtn.innerText = "IGNITING...";
    lightBtn.disabled = true; // Prevent spamming clicks while flickering

    // wait for animation to finish
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

lightBtn.addEventListener("mouseout", () => {
    lightBtn.title = "";
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

// Random build number
const verEl = document.querySelector(".version-display");
// Generates a version like "v2.0.592"
const buildNum = Math.floor(Math.random() * 999);
verEl.innerText = `SYS.VER.${actualVersion}.${buildNum}`;

verEl.addEventListener("click", () => {
    verEl.innerText = `Current Build: SYS.VER.${actualVersion}.${buildNum}\nAll systems nominal. No known bugs. Everything is fine.`;
    setTimeout(() => {
        verEl.innerText = `SYS.VER.${actualVersion}.${buildNum}`;
    }, 2000);
});


// Satellite Tracker Code

// Base ASCII Map

const baseMap = [
    "|                                                                       |",
    "|          . _..::__:  ,-\"-\"._        |]       ,     _,.__              |",
    "|  _.___ _ _<_>`!(._`.`-.    /         _._     `_ ,_/  '  '-._.---.-.__ |",
    "|.{     \" \"  -==,',._\\{  \\  /  {) _   / _ \">_,-' `                 /-/_ |",
    "|\\_.:--.        ._ )`^-.  \"'     / ( [_/(                        __,/-' |",
    "|'\"'    \\        \"    _\\         -_,--'                        /. (|    |",
    "|       |           ,'          _)_.\\\\._ <> {}             _,' /  '     |",
    "|       `.         /           [_/_'   \"(                <'}  )         |",
    "|        \\\\    .-. )           /   `-'\"..' `:._          _)  '          |",
    "|          \\  (   `(          /         `:\\  > \\  ,-^.  /' '            |",
    "|           `._,   \"\"         |           \\`'   \\|   ?_)  {\\            |",
    "|               =.---.        `._._       ,'     \"`  |' ,- '.           |",
    "|                |    `-._         |     /          `:`<_|=--._         |",
    "|                (        >        .     | ,          `=.__.`-'\\        |",
    "|                  .     /         |     |{|               ,-.,\\        |",
    "|                  |   ,'           \\   / `'             ,\"     `\\      |",
    "|                  |  /              |_'                 |  __   /      |",
    "|                  | |                                   '-'  `-'     \\.|",
    "|                  |/                                          \"      / |",
    "|                  \\.                                                '  |",
    "|                                                                       |",
    "|                   ,/           _ _____._.--._ _..---.---------.       |",
    "|__,-----\"-..?----_/ )\\    . ,-'\"              \"                   (__--/|",
    "|                    /__/\\/                                             |",
    "|                                                                       |"
];

// Map Dimensions
const MAP_W = 73;
const MAP_H = 25;


// simulate the "Fake" ones with simple physics
const satellites = [
    {
        name: "ISS (ZARYA)",
        type: "REAL",
        lat: 0, lon: 0,
        id: 25544,
        icon: "■",
        msg: "HUMAN ZOO"
    },
    {
        name: "CRAFTCAT_SAT_1",
        type: "FAKE",
        lat: 20, lon: -50,
        dLat: 0.5, dLon: 2.1, // Velocity
        icon: "◈",
        msg: "SHOOTING LASER POINTERS AT THE MOON"
    },
    {
        name: "ORBITAL_LASER",
        type: "FAKE",
        lat: -40, lon: 120,
        dLat: -0.3, dLon: 1.8,
        icon: "✦",
        msg: "TARGETING..."
    },
    {
        name: "SKY_NET_BETA",
        type: "FAKE",
        lat: 60, lon: 30,
        dLat: 0.1, dLon: -2.5, 
        icon: "※",
        msg: "JUDGMENT PENDING"
    },
    {
        name: "MCGILL_OCS_CUBESAT",
        type: "FAKE",
        lat: 0, lon: 80,
        dLat: 0.4, dLon: 2.2, 
        icon: "◉",
        msg: "MONITORING CONCORDIA"
    },
];

let currentSatIndex = 0; 

// Coordinate Mapper
// i call this move "steal code from stackoverflow"
// Maps -90/90 lat and -180/180 lon to the 73x25 grid
function mapCoords(val, inMin, inMax, outMin, outMax) {
    return Math.round((val - inMin) * (outMax - outMin) / (inMax - inMin) + outMin);
}

// 4. Update Loop
async function updateSatellites() {
    
    // --- A. UPDATE REAL SATELLITE (ISS) ---
    try {
        // Fetch only if it's the ISS (Index 0)
        const response = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
        const data = await response.json();
        satellites[0].lat = data.latitude;
        satellites[0].lon = data.longitude;
    } catch (e) { console.log("ISS Signal Lost"); }

    // update fake sal
    satellites.forEach(sat => {
        if (sat.type === "FAKE") {
            sat.lon += sat.dLon;
            sat.lat += sat.dLat;

            // Wrap around the globe
            if (sat.lon > 180) sat.lon -= 360;
            if (sat.lon < -180) sat.lon += 360;
            
            // Bounce off poles (simple physics)
            if (sat.lat > 85 || sat.lat < -85) sat.dLat *= -1;
        }
    });

    drawMap();
    
    // Loop every 2 seconds
    setTimeout(updateSatellites, 2000);
}

// Draw Function
function drawMap() {
    // Clone the base map so we don't overwrite it permanently
    let displayGrid = baseMap.map(line => line.split(""));

    // Plot each satellite
    satellites.forEach((sat, index) => {
        // Convert Lat/Lon to Row/Col
        // Lat: 90 to -90 -> 0 to Height
        const row = mapCoords(sat.lat, 90, -90, 0, MAP_H - 1);
        // Lon: -180 to 180 -> 0 to Width
        const col = mapCoords(sat.lon, -180, 180, 0, MAP_W - 1);

        // Safety check to prevent crashing if coordinates go out of bounds
        if (displayGrid[row] && displayGrid[row][col]) {
            if (row >= 0 && row < MAP_H && col >= 0 && col < MAP_W) {
                if (index === currentSatIndex) {
                     displayGrid[row][col] = `<span class="sat-active">${sat.icon}</span>`;
                } else {
                     displayGrid[row][col] = sat.icon; // Dimmer for others
                }
            }
        }
    });

    // Inject into HTML
    const finalMapString = displayGrid.map(line => line.join("")).join("\n");
    document.getElementById("ascii-map-display").innerHTML = finalMapString;
    
    // Update Header Text
    const activeSat = satellites[currentSatIndex];
    document.getElementById("sat-name").innerText = activeSat.name;
    document.getElementById("sat-lat").innerText = activeSat.lat.toFixed(2);
    document.getElementById("sat-lon").innerText = activeSat.lon.toFixed(2);
    document.getElementById("sat-status").innerText = activeSat.msg;
}

// Interaction: Cycle through satellites on click / keyboard
const issModuleEl = document.querySelector(".iss-module");

if (issModuleEl) {
    // Make the element focusable via keyboard
    issModuleEl.setAttribute("tabindex", "0");

    const cycleSatellite = () => {
        currentSatIndex++;
        if (currentSatIndex >= satellites.length) currentSatIndex = 0;
        drawMap(); // Instant update
    };

    issModuleEl.addEventListener("click", () => {
        cycleSatellite();
    });

    issModuleEl.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            // Prevent the page from scrolling on Space
            event.preventDefault();
            cycleSatellite();
        }
    });
}
function autoChangeSatellite() {
    currentSatIndex++;
    if (currentSatIndex >= satellites.length) currentSatIndex = 0;
    drawMap();
    setTimeout(autoChangeSatellite, 5000); // Change every 5 seconds
}

setTimeout(autoChangeSatellite, 5000);

updateSatellites();
