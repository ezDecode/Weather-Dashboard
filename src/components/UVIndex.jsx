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

const UVIndex = ({ data }) => {
  // Get average UV index
  const averageUV =
    data && data.length > 0
      ? Math.round(
          (data.reduce((sum, val) => sum + val, 0) / data.length) * 10
        ) / 10
      : 0;

  // Get max UV index
  const maxUV = data && data.length > 0 ? Math.max(...data) : 0;

  const hours = Array.from({ length: 6 }, (_, i) => i + 8); // 8 AM to 1 PM

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: Math.max(6, maxUV + 1), // Dynamic maximum
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        border: {
          display: false,
        },
        ticks: {
          color: "#6B7280",
          font: {
            size: 10,
          },
          stepSize: 1,
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
            return `UV Index: ${context.parsed.y}`;
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

  // Determine UV level text
  const getUVLevelText = (value) => {
    if (value <= 2) return "Low";
    if (value <= 5) return "Moderate";
    if (value <= 7) return "High";
    if (value <= 10) return "Very High";
    return "Extreme";
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="text-[#3B82F6] text-2xl font-light">
            {averageUV}
          </span>
          <p className="text-gray-500 text-xs mt-1">
            {getUVLevelText(averageUV)}
          </p>
        </div>
        {maxUV > 0 && (
          <div className="text-right">
            <span className="text-xs text-gray-500">Max: {maxUV}</span>
          </div>
        )}
      </div>
      <div className="h-[130px] mt-2">
        <Line options={options} data={chartData} />
      </div>
    </div>
  );
};

export default UVIndex;
