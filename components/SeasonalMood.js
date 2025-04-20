import React from "react";

export default function SeasonalMood({ mood }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, #6e44ff 0%, #b892ff 100%)",
      padding: "1rem",
      borderRadius: "1rem",
      textAlign: "center",
      color: "white",
      fontSize: "1.2rem",
      fontWeight: 600,
      margin: "1rem 0"
    }}>
      Seasonal Mood: {mood || "Loading..."}
    </div>
  );
}
