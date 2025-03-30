import { useState, useEffect } from "react";
import { LocationMarkerIcon } from "@heroicons/react/outline";
import { SunIcon, MoonIcon, RefreshIcon } from "@heroicons/react/solid";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

import SearchBar from "./components/SearchBar";
import WeatherChart from "./components/WeatherChart";
import UVIndex from "./components/UVIndex";
import RainChance from "./components/RainChance";

function App() {
  const [darkMode, setDarkMode] = useState(false); // Default to light mode
  const [viewMode, setViewMode] = useState("daily");
  const [forecastTab, setForecastTab] = useState("today"); // "today", "tomorrow", "5Days"
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);
  const [lastCity, setLastCity] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showTempChart, setShowTempChart] = useState(false);
  const [searchHistory, setSearchHistory] = useState(() => {
    const saved = localStorage.getItem("searchHistory");
    return saved ? JSON.parse(saved) : [];
  });

  const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

  // Debug logging
  useEffect(() => {
    console.log("API Key available:", !!API_KEY);
    console.log("Environment:", import.meta.env.MODE);
  }, [API_KEY]);

  // Apply theme based on darkMode state
  useEffect(() => {
    document.documentElement.classList.toggle("dark-theme", darkMode);
    document.documentElement.classList.toggle("light-theme", !darkMode);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", darkMode ? "#1a1b2e" : "#e6f1ff");
  }, [darkMode]);

  // Error auto-dismiss
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchWeatherData = async (city, isRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      if (!API_KEY) {
        throw new Error(
          "API key is missing. Please add your OpenWeather API key to the environment variables."
        );
      }

      // Input validation
      if (!city || typeof city !== "string") {
        throw new Error("Invalid city name provided");
      }

      // Always use the provided city for refreshing, don't use lastCity
      const targetCity = city;

      if (!isRefresh) {
        setLastCity(targetCity); // Only update lastCity on new searches, not refreshes
      }

      // Clean up city name - remove extra spaces and special characters
      const cleanedCity = targetCity
        .trim()
        .replace(/[^\w\s,-]/g, "")
        .replace(/\s+/g, " ")
        .split(",")[0];

      console.log("Fetching weather for city:", cleanedCity);

      // Add request timeout
      const axiosConfig = {
        timeout: 10000, // 10 seconds timeout
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      };

      // First try to get coordinates using geocoding API
      const geoResponse = await axios.get(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
          cleanedCity
        )}&limit=1&appid=${API_KEY}`,
        axiosConfig
      );

      if (!geoResponse.data || geoResponse.data.length === 0) {
        throw new Error(
          `City "${cleanedCity}" not found. Please check the spelling or try a different city name.`
        );
      }

      const { lat, lon, name: confirmedCityName } = geoResponse.data[0];

      // Fetch current weather and forecast in parallel
      const [weatherResponse, forecastResponse] = await Promise.all([
        axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`,
          axiosConfig
        ),
        axios.get(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`,
          axiosConfig
        ),
      ]);

      if (!weatherResponse.data) {
        throw new Error("Failed to fetch current weather data");
      }

      if (!forecastResponse.data) {
        throw new Error("Failed to fetch forecast data");
      }

      // Get current time for display
      const currentTime = new Date();
      const formattedTime = currentTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      // Transform the forecast data to match the expected format
      const transformedForecast = {
        hourly: forecastResponse.data.list.slice(0, 24).map((item) => ({
          temp: item.main.temp,
          time: new Date(item.dt * 1000).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          weather: item.weather[0],
          uvi: item.main?.uvi || 0,
          pop: item.pop || 0,
          humidity: item.main.humidity,
          wind: item.wind.speed,
        })),
        daily: forecastResponse.data.list
          .filter((item, index) => index % 8 === 0)
          .slice(0, 7) // Limit to 7 days
          .map((item) => ({
            temp: {
              day: item.main.temp,
              min: item.main.temp_min,
              max: item.main.temp_max,
            },
            weather: [
              {
                main: item.weather[0].main,
                description: item.weather[0].description,
                icon: item.weather[0].icon,
              },
            ],
            dt: item.dt,
            humidity: item.main.humidity,
            wind: item.wind.speed,
          })),
        current: {
          time: formattedTime,
          sunrise: weatherResponse.data.sys.sunrise,
          sunset: weatherResponse.data.sys.sunset,
        },
      };

      setWeather(weatherResponse.data);
      setForecast(transformedForecast);

      // Only show success message on refresh
      if (isRefresh) {
        setError({
          type: "success",
          message: "Weather data refreshed successfully!",
        });
      }

      // Update refresh key to trigger animations
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error("Weather fetch error:", err);
      if (err.response) {
        // Handle specific API errors
        switch (err.response.status) {
          case 401:
            setError({
              type: "error",
              message: "Invalid API key. Please check your configuration.",
            });
            console.error("API Error Details:", err.response.data);
            break;
          case 404:
            setError({
              type: "error",
              message: `City not found. Please try entering a different city name or check the spelling.`,
            });
            break;
          case 429:
            setError({
              type: "error",
              message: "Too many requests. Please try again later.",
            });
            break;
          default:
            setError({
              type: "error",
              message: `Error: ${
                err.response.data.message || "Failed to fetch weather data"
              }`,
            });
            console.error("API Error Details:", err.response.data);
        }
      } else if (err.request) {
        setError({
          type: "error",
          message:
            "No response received from weather service. Please check your internet connection.",
        });
      } else {
        setError({ type: "error", message: `${err.message}` });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (city) => {
    if (!city.trim()) {
      setError({ type: "error", message: "Please enter a city name" });
      return;
    }

    // Update search history
    const updatedHistory = [
      city,
      ...searchHistory.filter((item) => item !== city),
    ].slice(0, 5);
    setSearchHistory(updatedHistory);
    localStorage.setItem("searchHistory", JSON.stringify(updatedHistory));

    fetchWeatherData(city);
  };

  const handleRefresh = () => {
    if (lastCity) {
      fetchWeatherData(lastCity, true);
    } else if (weather) {
      // Fallback to current displayed city
      fetchWeatherData(weather.name, true);
    } else {
      setError({
        type: "error",
        message: "No location to refresh. Please search for a city first.",
      });
    }
  };

  const handleRemoveFromHistory = (cityToRemove) => {
    const updatedHistory = searchHistory.filter(
      (city) => city !== cityToRemove
    );
    setSearchHistory(updatedHistory);
    localStorage.setItem("searchHistory", JSON.stringify(updatedHistory));
  };

  useEffect(() => {
    const getLocation = () => {
      if (!navigator.geolocation) {
        setError({
          type: "error",
          message: "Geolocation is not supported by your browser",
        });
        setLocationPermission("denied");
        return;
      }

      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          // Reverse geocode to get city name
          try {
            const response = await axios.get(
              `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`
            );
            if (response.data && response.data[0]) {
              await fetchWeatherData(response.data[0].name);
              setLastCity(response.data[0].name);
              setLocationPermission("granted");
            }
          } catch (error) {
            console.error("Reverse geocoding error:", error);
            if (error.response?.status === 401) {
              setError({
                type: "error",
                message: "Invalid API key. Please check your configuration.",
              });
            } else {
              setError({
                type: "error",
                message: "Unable to get city name from location",
              });
            }
            setLocationPermission("denied");
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setError({
            type: "error",
            message:
              "Unable to get your location. Please search for a city instead.",
          });
          setLocationPermission("denied");
        }
      );
    };

    getLocation();
  }, []);

  // Function to get weather icon
  const getWeatherIcon = (condition) => {
    const iconMap = {
      Clear: "☀️",
      Clouds: "⛅",
      Rain: "🌧️",
      Drizzle: "🌦️",
      Thunderstorm: "⛈️",
      Snow: "❄️",
      Mist: "🌫️",
      Fog: "🌫️",
      Haze: "🌫️",
    };

    return iconMap[condition] || "🌤️";
  };

  return (
    <div
      className={`h-screen ${
        darkMode ? "bg-slate-900" : "bg-[#e6f1ff]"
      } pt-0 overflow-y-auto`}
    >
      {/* Floating SkyCast Header */}
      <div
        className={`${
          darkMode ? "bg-slate-800" : "bg-white"
        } rounded-2xl shadow-md mx-auto mt-4 mb-4 max-w-7xl sticky top-0 z-10`}
      >
        <div className="flex items-center justify-between p-4">
          <div className="relative w-full">
            <SearchBar
              onSearch={handleSearch}
              darkMode={darkMode}
              searchHistory={searchHistory}
              onRemoveFromHistory={handleRemoveFromHistory}
            />
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleRefresh}
              className="bg-slate-200 p-2 rounded-full hover:bg-slate-300 transition-colors"
              title="Refresh weather data"
            >
              <RefreshIcon className="h-5 w-5 text-slate-700" />
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="bg-slate-200 p-2 rounded-full hover:bg-slate-300 transition-colors"
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? (
                <SunIcon className="h-5 w-5 text-slate-700" />
              ) : (
                <MoonIcon className="h-5 w-5 text-slate-700" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl">
        {/* Error/Success Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`px-4 py-3 rounded-xl mb-4 ${
                error.type === "success"
                  ? "bg-white border border-green-500 text-green-600"
                  : "bg-white border border-red-500 text-red-600"
              }`}
            >
              {error.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Weather Content */}
        {weather && forecast && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pb-8">
            {/* Left Column - Current Weather */}
            <div className="md:col-span-7">
              <div
                className={`${
                  darkMode ? "bg-slate-800" : "bg-white"
                } rounded-2xl shadow-md p-4 mb-4`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <LocationMarkerIcon
                        className={`h-5 w-5 ${
                          darkMode ? "text-slate-200" : "text-slate-700"
                        }`}
                      />
                      <span
                        className={`${
                          darkMode ? "text-white" : "text-slate-700"
                        } text-lg font-medium`}
                      >
                        {weather
                          ? `${weather.name}, ${weather.sys.country}`
                          : "Loading location..."}
                      </span>
                    </div>
                    <div
                      className={`${
                        darkMode ? "text-slate-200" : "text-slate-600"
                      }`}
                    >
                      Current Weather
                    </div>
                    <div
                      className={`${
                        darkMode ? "text-slate-400" : "text-slate-500"
                      } text-sm`}
                    >
                      {forecast.current.time}
                    </div>
                  </div>
                  <div className="text-right flex items-center space-x-2">
                    <button
                      onClick={() => setShowTempChart(!showTempChart)}
                      className={`px-3 py-1 rounded-full transition-colors ${
                        showTempChart
                          ? "bg-blue-500 text-white"
                          : darkMode
                          ? "bg-slate-700 text-white hover:bg-slate-600"
                          : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                      }`}
                    >
                      Temperature Chart
                    </button>
                    <button
                      className={`${
                        darkMode
                          ? "text-slate-400 hover:text-white"
                          : "text-slate-400 hover:text-blue-500"
                      }`}
                    >
                      Fahrenheit
                    </button>
                  </div>
                </div>

                <div className="flex items-start mt-4">
                  <div className="flex items-center">
                    <div className="text-5xl text-amber-400">
                      {getWeatherIcon(weather.weather[0].main)}
                    </div>
                    <div className="ml-3">
                      <div
                        className={`text-6xl font-light ${
                          darkMode ? "text-white" : "text-slate-700"
                        }`}
                      >
                        {Math.round(weather.main.temp)}°
                        <span className="text-xl">C</span>
                      </div>
                      <div
                        className={`mt-1 ${
                          darkMode ? "text-slate-300" : "text-slate-500"
                        }`}
                      >
                        {weather.weather[0].main} <br />
                        Feels Like {Math.round(weather.main.feels_like)}°
                      </div>
                    </div>
                  </div>
                </div>

                {showTempChart && (
                  <div className="mt-4 bg-slate-50 rounded-xl p-4">
                    <WeatherChart
                      hourlyData={forecast.hourly.map((hour) => hour.temp)}
                      sunrise={new Date(
                        weather.sys.sunrise * 1000
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      sunset={new Date(
                        weather.sys.sunset * 1000
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    />
                  </div>
                )}

                <div className="mt-4 text-slate-700">
                  There will be mostly {weather.weather[0].description} skies.
                  The high will be {Math.round(weather.main.temp_max)}°
                </div>
              </div>

              {/* Weather Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded-2xl shadow-md p-4">
                  <div className="flex items-center mb-2">
                    <span className="text-blue-500 mr-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    <span>Air Quality</span>
                  </div>
                  <div className="text-3xl font-medium">
                    {weather.main.pressure / 10}
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-md p-4">
                  <div className="flex items-center mb-2">
                    <span className="text-blue-500 mr-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    <span>Wind</span>
                  </div>
                  <div className="text-3xl font-medium">
                    {Math.round(weather.wind.speed)} mph
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-md p-4">
                  <div className="flex items-center mb-2">
                    <span className="text-blue-500 mr-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
                      </svg>
                    </span>
                    <span>Humidity</span>
                  </div>
                  <div className="text-3xl font-medium">
                    {weather.main.humidity}%
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-md p-4">
                  <div className="flex items-center mb-2">
                    <span className="text-blue-500 mr-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    <span>Visibility</span>
                  </div>
                  <div className="text-3xl font-medium">
                    {Math.round(weather.visibility / 1609)} mi
                  </div>
                </div>
              </div>

              {/* Sun & Moon Summary */}
              <div className="bg-white rounded-2xl shadow-md p-4">
                <div className="mb-3 text-slate-600 font-medium">
                  Sun & Moon Summary
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <div className="flex items-center mb-2">
                      <SunIcon className="h-8 w-8 text-amber-400 mr-2" />
                      <div className="text-lg">
                        Sunrise
                        <br />
                        {new Date(
                          weather.sys.sunrise * 1000
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <div className="relative h-16">
                      <div className="w-full h-0.5 bg-gray-200 absolute top-1/2"></div>
                      <div className="relative h-full">
                        <div className="absolute left-1/4 top-1/2 w-4 h-4 rounded-full bg-amber-400 transform -translate-y-1/2"></div>
                        <div className="absolute left-1/4 top-0 w-16 h-8 border-t-2 border-amber-400 rounded-t-full"></div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center mb-2">
                      <MoonIcon className="h-8 w-8 text-blue-400 mr-2" />
                      <div className="text-lg">
                        Sunset
                        <br />
                        {new Date(weather.sys.sunset * 1000).toLocaleTimeString(
                          [],
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </div>
                    </div>
                    <div className="relative h-16">
                      <div className="w-full h-0.5 bg-gray-200 absolute top-1/2"></div>
                      <div className="relative h-full">
                        <div className="absolute left-1/2 top-1/2 w-4 h-4 rounded-full bg-blue-400 transform -translate-y-1/2"></div>
                        <div className="absolute left-1/3 top-0 w-16 h-8 border-t-2 border-blue-400 rounded-t-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Forecast */}
            <div className="md:col-span-5">
              <div className="bg-white rounded-2xl shadow-md p-4">
                <div className="flex mb-4 border-b">
                  <button
                    className={`px-4 py-2 ${
                      forecastTab === "today"
                        ? "text-blue-500 border-b-2 border-blue-500 -mb-px font-medium"
                        : "text-slate-600"
                    }`}
                    onClick={() => setForecastTab("today")}
                  >
                    Today
                  </button>
                  <button
                    className={`px-4 py-2 ${
                      forecastTab === "tomorrow"
                        ? "text-blue-500 border-b-2 border-blue-500 -mb-px font-medium"
                        : "text-slate-600"
                    }`}
                    onClick={() => setForecastTab("tomorrow")}
                  >
                    Tomorrow
                  </button>
                  <button
                    className={`px-4 py-2 ${
                      forecastTab === "10days"
                        ? "text-blue-500 border-b-2 border-blue-500 -mb-px font-medium"
                        : "text-slate-600"
                    }`}
                    onClick={() => setForecastTab("10days")}
                  >
                    5 Days
                  </button>
                </div>

                {/* Today's Hourly Forecast */}
                {forecastTab === "today" && (
                  <div className="space-y-4">
                    {forecast.hourly.slice(0, 6).map((hour, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg"
                      >
                        <div className="w-20">
                          <div className="text-slate-600 font-medium">
                            {hour.time}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="text-3xl mr-1">
                            {getWeatherIcon(hour.weather.main)}
                          </div>
                          <div className="text-amber-500 text-sm">
                            {hour.weather.main === "Rain" ? "⚡" : ""}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-light">
                            {Math.round(hour.temp)}°
                            <span className="text-xl">C</span>
                          </div>
                          <div className="text-xs text-slate-500">
                            Wind: {Math.round(hour.wind * 3.6)}km/h
                            <br />
                            Humidity: {hour.humidity}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tomorrow's Forecast */}
                {forecastTab === "tomorrow" && (
                  <div className="text-center py-8 text-slate-600">
                    Tomorrow's forecast will be available soon.
                  </div>
                )}

                {/* 10 Days Forecast */}
                {forecastTab === "10days" && (
                  <div className="space-y-2">
                    {forecast.daily.map((day, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg"
                      >
                        <div className="w-28">
                          <div className="font-medium">
                            {new Date(day.dt * 1000).toLocaleDateString(
                              "en-US",
                              { weekday: "long" }
                            )}
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(day.dt * 1000).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" }
                            )}
                          </div>
                        </div>
                        <div className="text-3xl">
                          {getWeatherIcon(day.weather[0].main)}
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-light">
                            {Math.round(day.temp.day)}°
                            <span className="text-xl">C</span>
                          </div>
                          <div className="text-xs text-slate-500">
                            Wind: {Math.round(day.wind * 3.6)}km/h
                            <br />
                            Humidity: {day.humidity}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
