import { motion } from "framer-motion";
import { useState } from "react";

const WeatherForecast = ({ forecast }) => {
  const [selectedDay, setSelectedDay] = useState(0); // Default to first day

  const formatDate = (date) => {
    return new Date(date * 1000).toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });
  };

  const formatDay = (date) => {
    const dateObj = new Date(date * 1000);
    return {
      day: dateObj.toLocaleDateString("en-US", { weekday: "long" }),
      date: `${dateObj.toLocaleDateString("en-US", {
        month: "short",
      })} ${dateObj.getDate()}`,
    };
  };

  // Return weather icon based on weather condition
  const getWeatherIcon = (condition) => {
    const iconMap = {
      Clear: "☀️",
      Clouds: "⛅",
      Rain: "🌧️",
      Drizzle: "🌦️",
      Thunderstorm: "⛈️",
      Snow: "❄️",
      Mist: "🌫️",
      Smoke: "🌫️",
      Haze: "🌫️",
      Dust: "🌫️",
      Fog: "🌫️",
      Sand: "🌫️",
      Ash: "🌫️",
      Squall: "💨",
      Tornado: "🌪️",
    };

    return iconMap[condition] || "☁️";
  };

  // If we have a selected day, show its detailed view
  const selectedDayData = forecast && forecast[selectedDay];

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-medium">Today</h3>

      {/* Selected day details */}
      {selectedDayData && (
        <div className="bg-[#252638] bg-opacity-50 rounded-xl p-5 mb-5 min-h-[200px]">
          <div className="flex justify-between items-start mb-5">
            <div>
              <p className="text-2xl font-medium">
                {formatDay(selectedDayData.dt).day}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {formatDay(selectedDayData.dt).date}
              </p>
            </div>
            <div
              className="text-6xl"
              title={selectedDayData.weather[0].description}
            >
              {getWeatherIcon(selectedDayData.weather[0].main)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">Min Temp</p>
              <p className="text-2xl">
                {Math.round(selectedDayData.temp.min)}°C
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Max Temp</p>
              <p className="text-2xl">
                {Math.round(selectedDayData.temp.max)}°C
              </p>
            </div>
          </div>

          <div>
            <p className="text-gray-400 text-sm mb-1">Weather</p>
            <p className="text-xl capitalize">
              {selectedDayData.weather[0].description}
            </p>
          </div>
        </div>
      )}

      {/* Day selection list */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-4">
          5-DAY FORECAST
        </h3>
        {forecast ? (
          <div className="space-y-1">
            {forecast.map((day, index) => (
              <motion.div
                key={day.dt}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors ${
                  selectedDay === index
                    ? "bg-[#6c5dd3]"
                    : "hover:bg-[#252638] hover:bg-opacity-30"
                }`}
                onClick={() => setSelectedDay(index)}
              >
                <div className="flex flex-col">
                  <p className="font-medium text-md">{formatDay(day.dt).day}</p>
                  <p className="text-xs text-gray-400">
                    {formatDay(day.dt).date}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl" title={day.weather[0].description}>
                    {getWeatherIcon(day.weather[0].main)}
                  </span>
                  <span className="text-3xl font-light">
                    {Math.round(day.temp.max)}°C
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400">
            No forecast data available
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherForecast;
