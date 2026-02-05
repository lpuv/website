// Satellite tracking system



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

const MAP_W = 73;
const MAP_H = 25;

// Define satellites based on whether it's Christmas
const satellites = isChristmas ? [
    {
        name: "SANTA_CLAUS",
        type: "REAL",
        lat: 0, lon: 0,
        icon: "🎅",
        msg: "DELIVERING PRESENTS"
    }
] : [
    {
        name: "ISS (ZARYA)",
        type: "REAL",
        lat: 0, lon: 0,
        id: 25544,
        icon: "■",
        msg: "WHAT ARE THEY EVEN DOING UP THERE?"
    },
    {
        name: "CRAFTCAT_SAT_1",
        type: "FAKE",
        lat: 20, lon: -50,
        dLat: 0.5, dLon: 2.1,
        icon: "◈",
        msg: "SHOOTING LASER POINTERS AT THE MOON"
    },
    {
        name: "CRAFTCAT_SAT_2",
        type: "FAKE",
        lat: -40, lon: 120,
        dLat: -0.3, dLon: 1.8,
        icon: "✦",
        msg: "BROADCASTING SUBLIMINAL MESSAGES"
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

// Coordinate mapper - maps lat/lon to grid coordinates
function mapCoords(val, inMin, inMax, outMin, outMax) {
    return Math.round((val - inMin) * (outMax - outMin) / (inMax - inMin) + outMin);
}

async function updateSantaPosition() {
    try {
        const santa_request = await fetch('https://santa-api.appspot.com/info?client=web');
        const data = await santa_request.json();
        const raw = data.location.split(',');
        satellites[0].lat = parseFloat(raw[0]);
        satellites[0].lon = parseFloat(raw[1]);
    }
    catch (e) {
        console.log("Santa Signal Lost");
    }

    drawMap();
    setTimeout(updateSantaPosition, 2000);
};

// Update satellite positions
async function updateSatellites() {
    // Update ISS position from API
    try {
        const response = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
        const data = await response.json();
        satellites[0].lat = data.latitude;
        satellites[0].lon = data.longitude;
    } catch (e) { 
        console.log("ISS Signal Lost"); 
    }

    // Update fake satellite positions
    satellites.forEach(sat => {
        if (sat.type === "FAKE") {
            sat.lon += sat.dLon;
            sat.lat += sat.dLat;

            // Wrap around the globe
            if (sat.lon > 180) sat.lon -= 360;
            if (sat.lon < -180) sat.lon += 360;
            
            // Bounce off poles
            if (sat.lat > 85 || sat.lat < -85) sat.dLat *= -1;
        }
    });

    drawMap();
    setTimeout(updateSatellites, 2000);
}

// Draw the map with satellites
function drawMap() {
    let displayGrid = baseMap.map(line => line.split(""));

    satellites.forEach((sat, index) => {
        const row = mapCoords(sat.lat, 90, -90, 0, MAP_H - 1);
        const col = mapCoords(sat.lon, -180, 180, 0, MAP_W - 1);

        if (displayGrid[row] && displayGrid[row][col]) {
            if (row >= 0 && row < MAP_H && col >= 0 && col < MAP_W) {
                if (index === currentSatIndex) {
                     displayGrid[row][col] = `<span class="sat-active">${sat.icon}</span>`;
                } else {
                     displayGrid[row][col] = sat.icon;
                }
            }
        }
    });

    const finalMapString = displayGrid.map(line => line.join("")).join("\n");
    document.getElementById("ascii-map-display").innerHTML = finalMapString;
    
    // Update info display
    const activeSat = satellites[currentSatIndex];
    const satNameEl = document.getElementById("sat-name");
    const satLatEl = document.getElementById("sat-lat");
    const satLonEl = document.getElementById("sat-lon");
    const satStatusEl = document.getElementById("sat-status");
    
    if (satNameEl) satNameEl.innerText = activeSat.name;
    if (satLatEl) satLatEl.innerText = activeSat.lat.toFixed(2);
    if (satLonEl) satLonEl.innerText = activeSat.lon.toFixed(2);
    if (satStatusEl) satStatusEl.innerText = activeSat.msg;
}

// Click/keyboard interaction
const issModuleEl = document.querySelector(".iss-module");

if (issModuleEl) {
    issModuleEl.setAttribute("tabindex", "0");

    const cycleSatellite = () => {
        currentSatIndex++;
        if (currentSatIndex >= satellites.length) currentSatIndex = 0;
        drawMap();
    };

    issModuleEl.addEventListener("click", cycleSatellite);
    issModuleEl.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            cycleSatellite();
        }
    });
}

// Collapse/Expand functionality
const collapseBtn = document.getElementById("sat-collapse-btn");
const satContent = document.querySelector(".sat-content");
const satTitle = document.querySelector(".iss-title");
const satFooter = document.querySelector(".iss-footer");

// Initialize collapsed state
if (isCollapsed) {
    satContent.style.display = "none";
    collapseBtn.innerText = "[ Expand ]";
}

if (isChristmas) {
    satTitle.innerText = "▬▬▬ SANTA TRACKING SYSTEM ▬▬▬";
    satFooter.innerText = satFooter.innerText.replace("Tracking Courtesy of Craftcat Orbital Freightworks", "Craftcat Orbital Freightworks wishes you a Merry Christmas!");
} else {
    satTitle.innerText = "▬▬▬ SATELLITE TRACKING SYSTEM ▬▬▬";
}

if (collapseBtn && satContent) {
    collapseBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent the module click event

        if (tooSmallScreen) {
            if (touchDevice) {
                satTitle.innerText = "Rotate device to restore orbital telemetry.";
            } else {
                satTitle.innerText = "Your screen size is noncompliant.";
            }
            setTimeout(() => {
                satTitle.innerText = isChristmas ? "▬▬▬ SANTA TRACKING SYSTEM ▬▬▬" : "▬▬▬ SATELLITE TRACKING SYSTEM ▬▬▬";
            }, 1000);
        } else {
            isCollapsed = !isCollapsed;
            if (isCollapsed) {
                satContent.style.display = "none";
                collapseBtn.innerText = "[ Expand ]";
            } else {
                satContent.style.display = "block";
                collapseBtn.innerText = "[ Collapse ]";
                // Start drawing the map when expanded for the first time
                drawMap();
                if (isChristmas) {
                    updateSantaPosition();
                } else {
                    updateSatellites();
                }
            }
        }
    });
}

// Auto-cycle through satellites
function autoChangeSatellite() {
    currentSatIndex++;
    if (currentSatIndex >= satellites.length) currentSatIndex = 0;
    if (!isCollapsed) { // Only draw if not collapsed
        drawMap();
    }
    setTimeout(autoChangeSatellite, 5000);
}

// Only start satellite tracking if not collapsed initially
if (!isCollapsed) {
    if (isChristmas) {
        updateSantaPosition();
    } else {
        updateSatellites();
    }
}

setTimeout(autoChangeSatellite, 5000);
