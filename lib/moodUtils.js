export function getTopGenres(artists) {
  const genreMap = {};

  artists?.forEach((artist) => {
    artist.genres.forEach((genre) => {
      genreMap[genre] = (genreMap[genre] || 0) + 1;
    });
  });

  const sortedGenres = Object.entries(genreMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const total = sortedGenres.reduce((acc, [, count]) => acc + count, 0);

  const genreData = {};
  sortedGenres.forEach(([genre, count]) => {
    genreData[genre] = Math.round((count / total) * 100);
  });

  return genreData;
}

export function getSeasonalMood(features) {
  const avgValence =
    features.reduce((sum, f) => sum + f.valence, 0) / features.length;
  const avgEnergy =
    features.reduce((sum, f) => sum + f.energy, 0) / features.length;

  if (avgValence > 0.7 && avgEnergy > 0.7) return "Summer Festival Rush";
  if (avgValence > 0.5) return "Chillwave Flow";
  if (avgEnergy > 0.7) return "Late-Night Raver";
  return "Melodic Afterglow";
}
