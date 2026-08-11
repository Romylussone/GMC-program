const form = document.querySelector('#search-form');
const input = document.querySelector('#city-input');
const statusMessage = document.querySelector('#status');
const weatherContent = document.querySelector('#weather-content');

const weatherCodes = {
  0: ['Clear sky', '☀️'], 1: ['Mainly clear', '🌤️'], 2: ['Partly cloudy', '⛅'],
  3: ['Overcast', '☁️'], 45: ['Foggy', '🌫️'], 48: ['Rime fog', '🌫️'],
  51: ['Light drizzle', '🌦️'], 53: ['Drizzle', '🌦️'], 55: ['Heavy drizzle', '🌧️'],
  61: ['Light rain', '🌦️'], 63: ['Rain', '🌧️'], 65: ['Heavy rain', '🌧️'],
  71: ['Light snow', '🌨️'], 73: ['Snow', '🌨️'], 75: ['Heavy snow', '❄️'],
  80: ['Rain showers', '🌦️'], 81: ['Rain showers', '🌧️'], 82: ['Heavy showers', '⛈️'],
  95: ['Thunderstorm', '⛈️'], 96: ['Thunderstorm with hail', '⛈️'], 99: ['Thunderstorm with hail', '⛈️']
};

document.querySelector('#today').textContent = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date());

function setText(id, value) { document.querySelector(id).textContent = value; }

async function getWeather(city) {
  statusMessage.textContent = 'Finding the latest weather…';
  weatherContent.hidden = true;

  try {
    const placeResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
    if (!placeResponse.ok) throw new Error('Location service is unavailable.');
    const placeData = await placeResponse.json();
    const place = placeData.results?.[0];
    if (!place) throw new Error(`We couldn't find “${city}”. Try another city name.`);

    const params = new URLSearchParams({ latitude: place.latitude, longitude: place.longitude, current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m', hourly: 'visibility', timezone: 'auto' });
    const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!weatherResponse.ok) throw new Error('Weather service is unavailable. Please try again.');
    const data = await weatherResponse.json();
    const current = data.current;
    const [description, icon] = weatherCodes[current.weather_code] || ['Unknown conditions', '🌡️'];
    const currentHour = current.time.slice(0, 13) + ':00';
    const visibilityIndex = data.hourly.time.indexOf(currentHour);

    setText('#location', `${place.name}${place.country ? `, ${place.country}` : ''}`);
    setText('#condition', description);
    setText('#weather-icon', icon);
    setText('#temperature', Math.round(current.temperature_2m));
    setText('#feels-like', `Feels like ${Math.round(current.apparent_temperature)}°C`);
    setText('#humidity', `${current.relative_humidity_2m}%`);
    setText('#wind-speed', `${Math.round(current.wind_speed_10m)} km/h`);
    setText('#visibility', visibilityIndex >= 0 ? `${(data.hourly.visibility[visibilityIndex] / 1000).toFixed(1)} km` : '—');
    setText('#precipitation', `${current.precipitation} mm`);

    statusMessage.textContent = '';
    weatherContent.hidden = false;
  } catch (error) {
    statusMessage.textContent = error.message || 'Something went wrong. Please try again.';
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const city = input.value.trim();
  if (city) getWeather(city);
});

input.value = 'London';
getWeather('London');
