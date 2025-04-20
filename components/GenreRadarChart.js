import React from "react";
import { Radar } from "react-chartjs-2";
import styles from "@/styles/GenreRadarChart.module.css";

export default function GenreRadarChart({ genres }) {
  const labels = Object.keys(genres);
  const values = Object.values(genres);

  const data = {
    labels,
    datasets: [{
      label: "Genre Weight",
      data: values,
      backgroundColor: "rgba(179,181,198,0.2)",
      borderColor: "rgba(179,181,198,1)",
      pointBackgroundColor: "rgba(179,181,198,1)"
    }]
  };

  const options = {
    scale: {
      ticks: { beginAtZero: true, max: 1 }
    }
  };

  return (
    <div className={styles.chartContainer}>
      <Radar data={data} options={options} />
    </div>
  );
}
