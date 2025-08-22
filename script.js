const apikey = '31d2f0b3ac2ca5b338288b02e207206c';

const searchBtn = document.getElementById('searchBtn');
const cityInput = document.getElementById('cityInput');
const cityName = document.getElementById('cityName');
const temp = document.getElementById('temp');
const description = document.getElementById('description');
const humidity = document.getElementById('humidity');
const wind = document.getElementById('wind');
const weatherIcon = document.getElementById('weatherIcon');

const weatherCard = document.getElementById('weatherCard');
const forecastCard = document.getElementById('forecastcard');
const forecastContainer = document.getElementById('forecast');

const chartCard = document.getElementById('chartCard');
const tempChartCanvas = document.getElementById('tempChart');

let tempChart;

// --- Geolocation helpers ---
async function getCityNameFromCoords(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=31d2f0b3ac2ca5b338288b02e207206c&units=metric`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to resolve city from coordinates');
  const data = await res.json();
  return data.name;
}

function requestLocationAndLoadWeather() {
  if (!('geolocation' in navigator)) {
    const lastCity = localStorage.getItem('lastCity') || 'Chennai';
    getWeather(lastCity);
    return;
  }

  navigator.geolocation.getCurrentPosition(async (pos) => {
    try {
      const { latitude, longitude } = pos.coords;
      const city = await getCityNameFromCoords(latitude, longitude);
      cityInput.value = city;
      await getWeather(city);
    } catch (err) {
      console.error(err);
      const lastCity = localStorage.getItem('lastCity') || 'Chennai';
      getWeather(lastCity);
    }
  }, (err) => {
    console.warn('Geolocation error:', err.message);
    const lastCity = localStorage.getItem('lastCity') || 'Chennai';
    getWeather(lastCity);
  }, {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 300000
  });
}

async function getWeather(city) {
  try {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=31d2f0b3ac2ca5b338288b02e207206c&units=metric`;
    const weatherRes = await fetch(weatherUrl);
    if (!weatherRes.ok) throw new Error('City not found');
    const weatherData = await weatherRes.json();

    cityName.textContent = `${weatherData.name}, ${weatherData.sys.country}`;
    temp.textContent = `${weatherData.main.temp}°C`;
    description.textContent = weatherData.weather[0].description;
    humidity.textContent = weatherData.main.humidity;
    wind.textContent = weatherData.wind.speed;
    weatherIcon.src = `https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`;

    weatherCard.style.display = 'block';
    localStorage.setItem('lastCity', city);

    setBackground(weatherData.weather[0].description);

    // Forecast
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=31d2f0b3ac2ca5b338288b02e207206c&units=metric`;
    const forecastRes = await fetch(forecastUrl);
    const forecastData = await forecastRes.json();

    renderForecast(forecastData.list);
    renderChart(forecastData.list);
  } catch (error) {
    alert(error.message);
  }
}

function renderForecast(list) {
  forecastContainer.innerHTML = '';
  const filtered = list.filter(item => item.dt_txt.includes('12:00:00'));
  filtered.forEach(item => {
    const day = new Date(item.dt_txt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    forecastContainer.innerHTML += `
      <div class="col forecast-day">
        <p><strong>${day}</strong></p>
        <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" alt="icon">
        <p>${item.main.temp}°C</p>
        <p class="text-capitalize">${item.weather[0].description}</p>
      </div>
    `;
  });
  forecastCard.style.display = 'block';
}

function renderChart(list) {
  const filtered = list.filter(item => item.dt_txt.includes('12:00:00'));
  const labels = filtered.map(item => new Date(item.dt_txt).toLocaleDateString('en-US', { weekday: 'short' }));
  const temps = filtered.map(item => item.main.temp);

  if (tempChart) tempChart.destroy();

  const ctx = tempChartCanvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, "rgba(255,99,132,0.8)");
  gradient.addColorStop(1, "rgba(54,162,235,0.8)");

  tempChart = new Chart(tempChartCanvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: "Temperature (°C)",
        data: temps,
        borderColor: gradient,
        backgroundColor: "rgba(255,255,255,0.15)",
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: "#fff",
        pointBorderColor: gradient,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: "#fff" } },
        y: { ticks: { color: "#fff" } }
      }
    }
  });

  chartCard.style.display = 'block';
}


function setBackground(description) {
  document.body.classList.remove('sunny', 'rainy', 'cloudy', 'night');
  document.querySelectorAll('.rain-drop').forEach(drop => drop.remove());

  if (description.includes('rain')) {
    document.body.classList.add('rainy');
    createRain();
  } else if (description.includes('cloud')) {
    document.body.classList.add('cloudy');
  } else if (description.includes('clear')) {
    document.body.classList.add('sunny');
  } else if (description.includes('night')) {
    document.body.classList.add('night');
  } else {
    document.body.classList.add('sunny');
  }
}

function createRain() {
  for (let i = 0; i < 100; i++) {
    const drop = document.createElement('div');
    drop.classList.add('rain-drop');
    drop.style.left = Math.random() * window.innerWidth + 'px';
    drop.style.animationDuration = 0.5 + Math.random() * 0.5 + 's';
    drop.style.animationDelay = Math.random() * 2 + 's';
    document.body.appendChild(drop);
  }
}

function updateWeatherAutomatically() {
  const city= cityInput.value.trim() || localStorage.getItem('lastCity');
  if(city) {
    getWeather(city);
  }
}


searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (city) getWeather(city);
});

document.getElementById('locBtn').addEventListener('click', () => {
  requestLocationAndLoadWeather();
});

document.getElementById('mapBtn').addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            // Open a new window with Google Maps showing your location
            const url = `https://www.google.com/maps/@${lat},${lon},12z`;
            window.open(url, '_blank'); // '_blank' opens in a new tab/window

        }, () => {
            alert("Unable to retrieve your location.");
        });
    } else {
        alert("Geolocation is not supported by your browser.");
    }
});



// On page load: try geolocation first
window.addEventListener('load', () => {
  requestLocationAndLoadWeather();
});

setInterval(updateWeatherAutomatically,10*60*1000);
updateWeatherAutomatically();

function showMap() {
  // Show the map div
  document.getElementById("map").style.display = "block";

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(success, error);
  } else {
    alert("Geolocation is not supported by your browser.");
  }

  function success(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    // Create the map centered at user location
    var map = L.map("map").setView([lat, lon], 10);

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);

    // Fetch weather for current location
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=31d2f0b3ac2ca5b338288b02e207206c&units=metric`
    )
      .then((res) => res.json())
      .then((data) => {
        const temp = data.main.temp;
        const desc = data.weather[0].description;
        const city = data.name;

        L.marker([lat, lon])
          .addTo(map)
          .bindPopup(`<b>${city}</b><br>${temp} °C<br>${desc}`)
          .openPopup();
      })
      .catch(() => {
        alert("Unable to fetch weather data.");
      });
  }

  function error() {
    alert("Unable to retrieve your location.");
  }
}