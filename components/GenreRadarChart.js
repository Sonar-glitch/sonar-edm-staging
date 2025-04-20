
import React from 'react';
import { Radar } from 'react-chartjs-2';

export default function GenreRadarChart({ genreData }) {
  const data = {
    labels: Object.keys(genreData),
    datasets: [{
      label: 'Your Sonic Signature',
      data: Object.values(genreData),
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1,
    }],
  };

  const options = {
    scale: {
      ticks: { beginAtZero: true, max: 100 },
    },
  };

  return <Radar data={data} options={options} />;
}
