

const tempEl = document.getElementById("temp-kelvin");
const descEl = document.getElementById("weather-desc");
const locationEl = document.getElementById("weather-location");

let temp = null;
let celsiusTemp = null;
let scale = "Kelvin";
let scaleLetter = "K";

let possible_scales = ["Kelvin", "Réaumur", "Rømer", "Rankine", "Newton", "Wedgwood", "Galen", "Real Celcius", "Dalton", "°X", "Craftcat Logistical"];
let possible_scale_letters = ["K", "°Ré", "°Rø", "°Ra", "°N", "°W", "Ga", "Real °C", "°Da", "°X", "°CL"];

function changeIntoRandomScale(tempC) {
    const scaleIndex = Math.floor(getRand() * possible_scales.length);
    const newScale = possible_scales[scaleIndex];
    scale = newScale;
    scaleLetter = possible_scale_letters[scaleIndex];

    let convertedTemp;
    switch (newScale) {
        case "Réaumur":
            convertedTemp = (tempC * 0.8).toFixed(2);
            break;
        case "Rømer":
            convertedTemp = ((tempC * 21/40) + 7.5).toFixed(2);
            break;
        case "Rankine":
            convertedTemp = ((tempC + 273.15) * 9/5).toFixed(2);
            break;
        case "Newton":
            if (tempC <= 37) {
                convertedTemp = ((tempC * 12) / 37).toFixed(2);
            } else {
                convertedTemp = ((((tempC - 37) * 22) / 63) + 12).toFixed(2); // this one is weird
            }
            break;
        case "Wedgwood":
            convertedTemp = (tempC * (1.3/100) - 8).toFixed(2);
            break;
        case "Galen":
            if (tempC <= 22) {
                convertedTemp = (((tempC * 4) / 22) - 4).toFixed(2);
            } else {
                convertedTemp = (((tempC - 22) * 4) / 78).toFixed(2);
            }
            break;
        case "Real Celcius":
            convertedTemp = (100 - tempC).toFixed(2);
            break;
        case "Dalton":
            convertedTemp = (Math.log((tempC + 273.15) / 273.15) * 320.55).toFixed(2);
            break;
        case "°X":
            if (tempC < 14.8) {
                convertedTemp = (0.48 * tempC + 42.9).toFixed(2);
            } else {
                convertedTemp = (1.19 * tempC + 32.4).toFixed(2);
            }
            break;
        case "Craftcat Logistical":
            // Proprietary temperature scale based on optimal shipping container temperatures
            // Formula: (|C|^1.08 / 9) * sign(C) + 42 - (C * 0.137) + sin(C / 10) * 3.14
            // Where 9 = letters in "Craftcat", 42 = answer to everything, 0.137 = company founding month/year :p
            const sign = tempC >= 0 ? 1 : -1;
            const absTempC = Math.abs(tempC);
            convertedTemp = (Math.pow(absTempC, 1.08) / 9 * sign + 42 - (tempC * 0.137) + Math.sin(tempC / 10) * 3.14159).toFixed(2);
            break;
        case "Kelvin":
        default:
            convertedTemp = (tempC + 273.15).toFixed(2);
            break;
    }
    return convertedTemp;
}


async function initWeather() {

    // WMO Weather Codes -> Robo-Speak
    const weatherCodes = {
        0: "CLEAR_SKY",
        1: "MAINLY_CLEAR",
        2: "PARTLY_CLOUDY",
        3: "OVERCAST",
        45: "FOG_DETECTED",
        48: "RIME_FOG",
        51: "LIGHT_DRIZZLE",
        53: "MODERATE_DRIZZLE",
        55: "DENSE_DRIZZLE",
        61: "SLIGHT_RAIN",
        63: "MODERATE_RAIN",
        65: "HEAVY_RAIN",
        71: "SNOW_FALL_SLIGHT",
        73: "SNOW_FALL_MOD",
        75: "SNOW_FALL_HEAVY",
        95: "THUNDERSTORM",
        96: "THUNDERSTORM_HAIL"
    };

    // 1. Get Location
    if (!navigator.geolocation) {
        tempEl.innerText = "ERR: NO_SENSOR";
        return;
    }

    let geolocationHandled = false;

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            if (!geolocationHandled) {
                geolocationHandled = true;
                console.log("Geolocation success:", position.coords.latitude, position.coords.longitude);
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                await fetchWeather(lat, lon);
            }
        },
        async (error) => {
            // User denied location or timeout - Default to specific coordinates (Antarctica)
            console.log("Geolocation error:", error.code, error.message);
            if (!geolocationHandled) {
                geolocationHandled = true;
                tempEl.innerText = "ACCESS_DENIED";
                descEl.innerText = "UNKNOWN_COORDS";
                const lat = -90.0000;
                const lon = 0.0000;
                await fetchWeather(lat, lon);
            }
        },
        {
            timeout: 15000, // 15 second timeout for geolocation
            maximumAge: 600000, // Accept cached position up to 10 minutes old
            enableHighAccuracy: false // Faster, less accurate positioning
        }
    );

    async function fetchWeather(lat, lon) {
        try {
            // Fetch current weather (Temperature is in Celsius by default)
            const res = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
            );
            const data = await res.json();
            console.log("Weather Data:", data);
            
            const celsius = data.current_weather.temperature;
            const wmoCode = data.current_weather.weathercode;

            celsiusTemp = celsius;
            temp = changeIntoRandomScale(celsius);


            tempEl.innerText = `${temp} ${scaleLetter}`;
            
            // Look up code or default to "ANOMALY"
            const condition = weatherCodes[wmoCode] || "ATMOSPHERIC_ANOMALY";
            descEl.innerText = condition;
            
            // Fetch location name using reverse geocoding
            try {
                const geoRes = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`
                );
                const geoData = await geoRes.json();
                console.log("Geocoding Data:", geoData);
                const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || geoData.address?.county || "We Will Find You";
                const country = geoData.address?.country || "";
                locationEl.innerText = country ? `${city}, ${country}` : city;
            } catch (geoErr) {
                console.error("Geocoding error:", geoErr);
                locationEl.innerText = `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
            }

        } catch (err) {
            console.error(err);
            tempEl.innerText = "ERR: SENSOR_FAIL";
        }
    }
}

tempEl.addEventListener("mouseover", () => {
    // Show Celsius on hover
    if (celsiusTemp !== null) {
        tempEl.innerText = `${celsiusTemp.toFixed(2)} °C`;
        tempEl.title = `What, you can't handle ${scale}?\nP.S. Yes, ${scale} is a real thing. No, we didn't make it up. Obviously. It's not like we named a scale after ourselves or anything.`;
    }
});

tempEl.addEventListener("mouseout", () => {
    // Revert to random scale
    if (temp !== null) {
        tempEl.innerText = `${temp} ${scaleLetter}`;
        tempEl.title = "";
    }
});

initWeather();