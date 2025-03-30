import { Line } from "react-chartjs-2";
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

const RainChance = ({ data }) => {
  // Get average precipitation
  const averagePrecipitation =
    data && data.length > 0
      ? Math.round(data.reduce((sum, val) => sum + val, 0) / data.length)
      : 0;

  // Get max precipitation
  const maxPrecipitation = data && data.length > 0 ? Math.max(...data) : 0;

  const hours = Array.from({ length: 6 }, (_, i) => i + 8); // 8 AM to 1 PM

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: Math.max(100, maxPrecipitation + 10), // Dynamic maximum
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        border: {
          display: false,
        },
        ticks: {
          callback: (value) => `${value}%`,
          color: "#6B7280",
          font: {
            size: 10,
          },
          stepSize: 20,
        },
      },
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: "#6B7280",
          maxRotation: 0,
          font: {
            size: 10,
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        titleColor: "#000",
        bodyColor: "#000",
        borderColor: "#ddd",
        borderWidth: 1,
        padding: 8,
        displayColors: false,
        callbacks: {
          title: function (tooltipItems) {
            return tooltipItems[0].label;
          },
          label: function (context) {
            return `Precipitation: ${context.parsed.y}%`;
          },
        },
      },
    },
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 2,
      },
      point: {
        radius: 3,
        hoverRadius: 5,
        backgroundColor: "#fff",
        borderColor: "#3B82F6",
        borderWidth: 1.5,
      },
    },
  };

  const chartData = {
    labels: hours.map((hour) => `${hour}:00`),
    datasets: [
      {
        data: data ? data.slice(0, 6) : Array(6).fill(0),
        borderColor: "#3B82F6",
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 150);
          gradient.addColorStop(0, "rgba(59, 130, 246, 0.1)");
          gradient.addColorStop(1, "rgba(59, 130, 246, 0)");
          return gradient;
        },
        fill: true,
      },
    ],
  };

  // Determine precipitation status text
  const getPrecipitationStatus = (value) => {
    if (value === 0) return "No precipitation";
    if (value < 20) return "Light precipitation";
    if (value < 50) return "Moderate precipitation";
    return "Heavy precipitation";
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="text-[#3B82F6] text-2xl font-light">
            {averagePrecipitation}%
          </span>
          <p className="text-gray-500 text-xs mt-1">
            {getPrecipitationStatus(averagePrecipitation)}
          </p>
        </div>
        {maxPrecipitation > 0 && (
          <div className="text-right">
            <span className="text-xs text-gray-500">
              Max: {maxPrecipitation}%
            </span>
          </div>
        )}
      </div>
      <div className="h-[130px]">
        <Line options={options} data={chartData} />
      </div>
    </div>
  );
};

export default RainChance;
