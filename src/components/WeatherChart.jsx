import { Line } from "react-chartjs-2";
import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
);

const WeatherChart = ({ hourlyData, sunrise, sunset }) => {
  // Use 3-hour intervals instead of hourly
  const threeHourIntervals = Array.from({ length: 8 }, (_, i) => i * 3);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Find min and max temperature to set y-axis range
  const minTemp = Math.min(...hourlyData) - 5;
  const maxTemp = Math.max(...hourlyData) + 5;

  // Update theme when document changes
  useEffect(() => {
    const checkTheme = () => {
      setIsDarkMode(
        !document.documentElement.classList.contains("light-theme")
      );
    };

    checkTheme(); // Initial check

    // Set up a mutation observer to watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: isDarkMode ? "#2a2b3d" : "#ffffff",
        titleColor: isDarkMode ? "#fff" : "#111827",
        bodyColor: isDarkMode ? "#fff" : "#111827",
        borderColor: "#6c5dd3",
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          title: function (tooltipItems) {
            return `${tooltipItems[0].label}`;
          },
          label: function (context) {
            return `${context.parsed.y.toFixed(1)}°C`;
          },
        },
      },
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        min: minTemp,
        max: maxTemp,
        grid: {
          color: getComputedStyle(document.documentElement).getPropertyValue(
            "--chart-grid"
          ),
          drawBorder: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: isDarkMode ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
          font: {
            size: 10,
          },
          padding: 10,
          callback: function (value) {
            return value + "°C";
          },
        },
      },
      x: {
        grid: {
          color: getComputedStyle(document.documentElement).getPropertyValue(
            "--chart-grid"
          ),
          drawBorder: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: isDarkMode ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
          maxRotation: 0,
          font: {
            size: 10,
          },
          padding: 5,
        },
      },
    },
    elements: {
      line: {
        tension: 0.4,
      },
      point: {
        radius: 3,
        hoverRadius: 6,
        backgroundColor: "#6c5dd3",
        borderColor: isDarkMode ? "#fff" : "#fff",
        borderWidth: 2,
      },
    },
  };

  // Filter data for 3-hour intervals
  const filteredHourlyData = threeHourIntervals.map(
    (hour) => hourlyData[hour] || null
  );

  const data = {
    labels: threeHourIntervals.map((hour) => `${hour}:00`),
    datasets: [
      {
        label: "Temperature",
        data: filteredHourlyData,
        borderColor: "#6c5dd3",
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, "rgba(108, 93, 211, 0.3)");
          gradient.addColorStop(1, "rgba(108, 93, 211, 0)");
          return gradient;
        },
        fill: true,
        borderWidth: 2,
      },
    ],
  };

  return (
    <div>
      <div className="h-[220px]">
        <Line options={options} data={data} />
      </div>
      <div className="mt-2 flex justify-between text-xs text-gray-400">
        <div>
          <span className="font-medium">Sunrise:</span> {sunrise}
        </div>
        <div>
          <span className="font-medium">Sunset:</span> {sunset}
        </div>
      </div>
    </div>
  );
};

export default WeatherChart;
