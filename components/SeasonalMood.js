import React from "react";

export default function SeasonalMood({ mood }) {
  return (
    <div className="seasonal-mood">
      <h2>Current Mood:</h2>
      <p>{mood || "Unknown"}</p>
    </div>
  );
}
