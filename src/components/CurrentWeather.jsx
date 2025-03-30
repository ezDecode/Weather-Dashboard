import { motion } from "framer-motion";

const CurrentWeather = ({ data }) => {
  if (!data) return null;

  const {
    name,
    main: { temp, feels_like, humidity },
    weather: [{ main: condition, icon }],
    wind: { speed },
  } = data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-lg"
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{name}</h2>
          <p className="text-gray-500">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              hour: "numeric",
              minute: "numeric",
            })}
          </p>
        </div>
        <div className="text-right">
          <img
            src={`http://openweathermap.org/img/wn/${icon}@2x.png`}
            alt={condition}
            className="w-16 h-16"
          />
          <p className="text-lg font-medium text-gray-600">{condition}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="text-6xl font-bold text-gray-800">
            {Math.round(temp)}°C
          </div>
          <p className="text-gray-500">Feels like {Math.round(feels_like)}°</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">Wind Speed</span>
            <span className="font-medium">{speed} km/h</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Humidity</span>
            <span className="font-medium">{humidity}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CurrentWeather;
