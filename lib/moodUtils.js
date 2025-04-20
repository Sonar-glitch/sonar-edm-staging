export function detectMoodFromAudio(audioFeatures) {
  const { energy, valence, tempo } = audioFeatures;

  if (energy > 0.7 && tempo > 120 && valence > 0.6) return "Hyper Techno Rush";
  if (energy < 0.4 && valence < 0.5) return "Late-Night Melodic Wave";
  if (valence > 0.7 && tempo < 110) return "Chill Day Vibes";
  if (energy > 0.6 && valence < 0.4) return "Dark Room Pulse";
  return "Dreamy Deep Sunset";
}
