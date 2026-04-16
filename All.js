// Dropdown Menu

const userMenu = document.getElementById('userMenu');
const profileDropdown = document.getElementById('profileDropdown');
const dropdownArrow = document.getElementById('dropdownArrow');

userMenu.onclick = function () {
    const isOpen = profileDropdown.style.display === 'block';
    profileDropdown.style.display = isOpen ? 'none' : 'block';
    dropdownArrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
};
window.onclick = function (event) {
    if (!userMenu.contains(event.target)) {
        profileDropdown.style.display = 'none';
        dropdownArrow.style.transform = 'rotate(0deg)';
    }
};

//Weather JS
async function updateWeather() {
    const card = document.getElementById('weather-card');
    const cityName = document.getElementById('city-name');

    try {

        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;


            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;

            const response = await fetch(url);
            const data = await response.json();
            const current = data.current;

            const geoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
            const geoResponse = await fetch(geoUrl);
            const geoData = await geoResponse.json();

            cityName.innerText = geoData.city || geoData.locality || "Current Location";
            document.getElementById('temp').innerText = `${Math.round(current.temperature_2m)}°C`;
            document.getElementById('humidity').innerText = `${current.relative_humidity_2m}%`;
            document.getElementById('wind').innerText = `${current.wind_speed_10m} km/h`;

            const weatherInfo = getWeatherDetails(current.weather_code);
            document.getElementById('description').innerText = weatherInfo.label;
            document.getElementById('weather-icon').innerText = weatherInfo.icon;

            card.style.opacity = "1";

        }, (error) => {
            cityName.innerText = "Location Denied";
            console.error(error);
        });

    } catch (err) {
        cityName.innerText = "Error Loading";
    }
}


function getWeatherDetails(code) {
    const mapping = {
        0: { label: "Clear Sky", icon: "☀️" },
        1: { label: "Mainly Clear", icon: "🌤️" },
        2: { label: "Partly Cloudy", icon: "⛅" },
        3: { label: "Overcast", icon: "☁️" },
        45: { label: "Foggy", icon: "🌫️" },
        61: { label: "Slight Rain", icon: "🌦️" },
        63: { label: "Rain", icon: "🌧️" },
        71: { label: "Snow", icon: "❄️" },
        95: { label: "Thunderstorm", icon: "⛈️" }
    };
    return mapping[code] || { label: "Cloudy", icon: "☁️" };
}

updateWeather();

//Logo in user circle
const name = localStorage.getItem("userName");

if (name) {
    document.getElementById("userName").innerText = name;
    document.getElementById("userCircle").innerText = name.charAt(0).toUpperCase();
} else {
    // fallback (optional)
    document.getElementById("userName").innerText = "Guest";
    document.getElementById("userCircle").innerText = "G";
}


//Booking


// Sport selection and player details
document.querySelectorAll('.sport-card').forEach(card => {
    card.addEventListener('click', () => {
        document.querySelectorAll('.sport-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        fillCoinDiv();
    });
});

// Player count input
document.getElementById('player-count').addEventListener('input', function () {
    const count = parseInt(this.value, 10);
    const container = document.getElementById('player-details');
    container.innerHTML = '';
    if (count > 0 && count <= 20) {
        container.style.display = 'block';
        for (let i = 1; i <= count; i++) {
            const playerDiv = document.createElement('div');
            playerDiv.style.marginBottom = '18px';
            playerDiv.innerHTML = `
                    <strong>Player ${i}</strong><br>
                    <input type="text" name="player${i}_name" placeholder="Name" style="margin:6px 8px 6px 0; padding:8px; border-radius:6px; border:1px solid #e5e7eb;">
                    <input type="number" name="player${i}_mobile" placeholder="Mobile Number" style="margin:6px 8px 6px 0; padding:8px; border-radius:6px; border:1px solid #e5e7eb;">
                    <input type="email" name="player${i}_email" placeholder="Gmail" style="margin:6px 8px 6px 0; padding:8px; border-radius:6px; border:1px solid #e5e7eb;">
                `;
            container.appendChild(playerDiv);
        }
    }
});


// Summary and confirmation
function getSelectedSport() {
    const selected = document.querySelector('.sport-card.selected strong');
    return selected ? selected.textContent : '';
}
function getSelectedDate() {
    const date = document.getElementById('date-input').value;
    if (!date) return '';
    const dateObj = new Date(date);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return dateObj.toLocaleDateString(undefined, options);
}
function getSelectedSlot() {
    const slot = document.getElementById('time-slot').value;
    const slotMap = {
        "9-10": "9:00 AM - 10:00 AM",
        "10-11": "10:00 AM - 11:00 AM",
        "11-12": "11:00 AM - 12:00 PM",
        "12-1": "12:00 PM - 1:00 PM",
        "1-2": "1:00 PM - 2:00 PM",
        "2-3": "2:00 PM - 3:00 PM",
        "3-4": "3:00 PM - 4:00 PM",
        "4-5": "4:00 PM - 5:00 PM"
    };
    return slotMap[slot] || slot;
}
function getPlayerCount() {
    return document.getElementById('player-count').value || '';
}

function fillBookingSummary() {
    document.getElementById('summary-sport').textContent = getSelectedSport();
    document.getElementById('summary-date').textContent = getSelectedDate();
    document.getElementById('summary-slot').textContent = getSelectedSlot();
    document.getElementById('summary-players').textContent = getPlayerCount();
    fillCoinDiv();
}

function fillCoinDiv() {
    const selectedCard = document.querySelector('.sport-card.selected');
    const price = selectedCard ? parseInt(selectedCard.getAttribute('data-price'), 10) : 0;
    const totalCost = price;
    const availableCoins = parseInt(document.querySelector('.coin-amount').textContent, 10) || 0;
    const remaining = availableCoins - totalCost;

    document.getElementById('coin-div').innerHTML = `
            <div style="background:#f1f8ff; border:1px solid #b6d4fe; border-radius:16px; padding:22px 28px; margin:32px 0 0 0; display:flex; align-items:center; justify-content:space-between;">
                <div>
                    <span style="font-size:1.2em; font-weight:bold; color:#222;"><i class="fas fa-coins" style="color:#2563eb; margin-right:8px;"></i> Total Cost:</span>
                    <div style="margin-top:10px; font-size:1.1em; color:#444;">Remaining balance after booking: <b>${remaining} coins</b></div>
                </div>
                <div style="font-size:2em; font-weight:700; color:#2563eb;">${totalCost} coins</div>
            </div>
        `;
}

// Update summary when user clicks "Next" on the last step  
document.querySelectorAll('.btn-next').forEach(btn => {
    btn.addEventListener('click', function () {
        if (document.getElementById('content-4').style.display === 'block' || document.getElementById('content-4').style.display === '') {
            fillBookingSummary();
            fillCoinDiv();
        }
    });
});

// Step navigation logic
const steps = [
    { content: 'content-1', step: 'step1', line: null },
    { content: 'content-2', step: 'step2', line: 'line-1' },
    { content: 'content-3', step: 'step3', line: 'line-2' },
    { content: 'content-4', step: 'step4', line: 'line-3' }
];
let currentStep = 0;

// Function to show a specific step and update the progress bar
function showStep(idx) {
    steps.forEach((s, i) => {
        document.getElementById(s.content).style.display = (i === idx) ? 'block' : 'none';
        const stepDiv = document.getElementById(s.step).querySelector('div');
        if (i < idx) {
            stepDiv.style.background = '#2563eb';
            stepDiv.style.color = '#fff';
        } else if (i === idx) {
            stepDiv.style.background = '#2563eb';
            stepDiv.style.color = '#fff';
        } else {
            stepDiv.style.background = '#e5e7eb';
            stepDiv.style.color = '#6b7280';
        }
        const label = document.getElementById(s.step).querySelector('.label, span');
        if (i <= idx) {
            label.style.color = '#2563eb';
            label.style.fontWeight = 'bold';
        } else {
            label.style.color = '#6b7280';
            label.style.fontWeight = 'normal';
        }

        if (s.line) {
            const lineDiv = document.getElementById(s.line);
            lineDiv.style.background = (i <= idx) ? '#2563eb' : '#d1d5db';
        }
    });
    currentStep = idx;

    if (idx === 3) {
        fillBookingSummary();
    }
}
document.getElementById('next-btn-1').onclick = () => showStep(1);
document.getElementById('back-btn-2').onclick = () => showStep(0);
document.getElementById('next-btn-2').onclick = () => showStep(2);
document.getElementById('back-btn-3').onclick = () => showStep(1);
document.getElementById('next-btn-3').onclick = () => showStep(3);
document.getElementById('back-btn-4').onclick = () => showStep(2);


showStep(0);

function showBookingPopover(message = "Booking Confirmed!") {
    let pop = document.createElement('div');
    pop.id = 'booking-popover';

    pop.innerHTML = `
        <div style="
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #f0fdf4;
            border: 2px solid #10b981;
            border-radius: 16px;
            padding: 30px 40px;
            box-shadow: 0 8px 32px rgba(16,185,129,0.2);
            z-index: 9999;
            text-align: center;
            animation: fadeIn 0.3s ease;
        ">
            <div style="font-size: 2.5em; color: #10b981; margin-bottom: 10px;">
                <i class="fas fa-check-circle"></i>
            </div>
            <div style="font-size: 1.3em; font-weight: bold; margin-bottom: 6px;">
                ${message}
            </div>
            <div style="color: #444;">
                Your slot has been reserved successfully.
            </div>
        </div>
    `;

    document.body.appendChild(pop);

    setTimeout(() => {
        pop.remove();
        window.location.href = "book.html";
    }, 2000);
}
const courts = {
    "Basketball": 2,
    "Badminton": 2,
    "Cricket": 1,
    "Football": 1
};
async function updateAvailableSlots() {
    const sport = getSelectedSport();
    const date = document.getElementById("date-input").value;

    if (!sport || !date) return;

    const totalCourts = courts[sport];

    const res = await fetch("https://elite-sports-complex.onrender.com/all-bookings");
    const data = await res.json();

    const slotCounts = {};
    data.bookings.forEach(b => {
        if (b.sport === sport && b.date === date) {
            slotCounts[b.time] = (slotCounts[b.time] || 0) + 1;
        }
    });

    const slotMap = {
        "9-10": "9:00 AM - 10:00 AM",
        "10-11": "10:00 AM - 11:00 AM",
        "11-12": "11:00 AM - 12:00 PM",
        "12-13": "12:00 PM - 1:00 PM",
        "13-14": "1:00 PM - 2:00 PM",
        "14-15": "2:00 PM - 3:00 PM",
        "15-16": "3:00 PM - 4:00 PM",
        "16-17": "4:00 PM - 5:00 PM"
    };

    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const select = document.getElementById("time-slot");
    select.innerHTML = `<option value="">--Select Time Slot--</option>`;

    let availableCount = 0;

    Object.keys(slotMap).forEach(slot => {
        const [startHour, endHour] = slot.split("-").map(Number);

        const slotStartMinutes = startHour * 60;
        const booked = slotCounts[slot] || 0;

        const isPast = (date === today && slotStartMinutes <= currentMinutes);
        const isFull = (booked >= totalCourts);

        if (!isPast && !isFull) {
            const option = document.createElement("option");
            option.value = slot;
            option.textContent = slotMap[slot];

            select.appendChild(option);
            availableCount++;
        }
    });

    if (availableCount === 0) {
        const option = document.createElement("option");
        option.textContent = "No slots available";
        option.disabled = true;
        select.appendChild(option);
    }
}
document.getElementById("date-input").addEventListener("change", updateAvailableSlots);

document.querySelectorAll('.sport-card').forEach(card => {
    card.addEventListener('click', updateAvailableSlots);
});
const today = new Date().toISOString().split("T")[0];
document.getElementById("date-input").value = today;
document.getElementById("date-input").setAttribute("min", today);
document.getElementById("date-input").addEventListener("input", function () {
    const today = new Date().toISOString().split("T")[0];

    if (this.value < today) {
        this.value = today;
    }
});
