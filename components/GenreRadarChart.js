import React from "react";
import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export default function GenreRadarChart({ genreData }) {
  const data = {
    labels: Object.keys(genreData),
    datasets: [
      {
        label: "Your Genre Signature",
        data: Object.values(genreData),
        backgroundColor: "rgba(138, 43, 226, 0.2)",
        borderColor: "rgba(138, 43, 226, 1)",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    scales: {
      r: {
        angleLines: { display: true },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: {
          stepSize: 20,
          color: "#ccc",
        },
        pointLabels: {
          color: "#eee",
        },
        grid: {
          color: "#444",
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: "#eee",
        },
      },
    },
  };

  return (
    <div style={{ width: "100%", maxWidth: 480, margin: "0 auto" }}>
      <Radar data={data} options={options} />
    </div>
  );
}
