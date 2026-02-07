const axios = require('axios');

const getWeatherData = async (lat, lng) => {
    try {
        const apiKey = process.env.OPENWEATHER_API_KEY;
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${apiKey}`;

        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error("Weather API Error:", error.response?.data || error.message);
        return null;
    }
};

const generateWeatherAdvice = (weather) => {
    const advice = [];
    const temp = weather.main.temp;
    const humidity = weather.main.humidity;
    const rain = weather.rain ? weather.rain['1h'] : 0;
    const wind = weather.wind.speed;
    const description = weather.weather[0].description;

    // 1. Irrigation Advice
    if (rain > 0.5) {
        advice.push({
            title: "Skip Irrigation Today",
            desc: `Rainfall (${rain}mm) detected. Natural watering is sufficient.`,
            priority: "Low"
        });
    } else if (temp > 30 && humidity < 40) {
        advice.push({
            title: "Increase Irrigation",
            desc: `High heat (${temp}°C) and low humidity. Crops may experience stress.`,
            priority: "High"
        });
    } else {
        advice.push({
            title: "Standard Irrigation",
            desc: "Weather conditions are normal. Follow routine schedule.",
            priority: "Medium"
        });
    }

    // 2. Spraying Conditions
    if (wind > 15) {
        advice.push({
            title: "Avoid Spraying Pesticides",
            desc: `High wind speeds (${wind} km/h) will cause drift. Wait for calm weather.`,
            priority: "High"
        });
    } else if (rain > 0) {
        advice.push({
            title: "Postpone Spraying",
            desc: "Rain will wash away chemicals. Wait for dry spell.",
            priority: "High"
        });
    }

    // 3. General Alert
    if (temp < 5) {
        advice.push({
            title: "Frost Warning",
            desc: "Temperature dropping below 5°C. Cover sensitive nursery plants.",
            priority: "High"
        });
    } else if (description.includes("storm") || description.includes("thunder")) {
        advice.push({
            title: "Storm Alert",
            desc: "Severe weather expected. Secure loose equipment and stay indoors.",
            priority: "High"
        });
    }

    return {
        location: weather.name,
        temp: temp,
        condition: description,
        advice: advice
    };
};

module.exports = { getWeatherData, generateWeatherAdvice };
