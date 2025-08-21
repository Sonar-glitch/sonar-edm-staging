import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, 
         PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import styles from '../styles/TasteMatchVisuals.module.css';

const TasteMatchVisuals = ({ tasteMatch, compact = false }) => {
  if (!tasteMatch?.analysis) {
    return null;
  }

  const { analysis } = tasteMatch;

  if (compact) {
    return <CompactTasteDisplay analysis={analysis} />;
  }

  return (
    <div className={styles.visualContainer}>
      <div className={styles.insightsSummary}>
        {analysis.insights.map((insight, index) => (
          <InsightBadge key={index} insight={insight} />
        ))}
      </div>
      
      {analysis.visualData.soundRadar && (
        <div className={styles.chartSection}>
          <h4>Audio DNA Match</h4>
          <SoundRadarChart data={analysis.visualData.soundRadar} />
        </div>
      )}
      
      {analysis.visualData.matchWheel && (
        <div className={styles.chartSection}>
          <h4>Match Breakdown</h4>
          <MatchWheelChart data={analysis.visualData.matchWheel} />
        </div>
      )}
      
      {analysis.visualData.artistNetwork && (
        <div className={styles.chartSection}>
          <h4>Artist Connections</h4>
          <ArtistNetworkDisplay data={analysis.visualData.artistNetwork} />
        </div>
      )}
      
      {analysis.visualData.genreHeatmap && (
        <div className={styles.chartSection}>
          <h4>Genre Affinity</h4>
          <GenreHeatmapDisplay data={analysis.visualData.genreHeatmap} />
        </div>
      )}
    </div>
  );
};

const CompactTasteDisplay = ({ analysis }) => {
  return (
    <div className={styles.compactDisplay}>
      <div className={styles.quickInsights}>
        {analysis.insights.slice(0, 2).map((insight, index) => (
          <div key={index} className={`${styles.insightChip} ${styles[insight.type]}`}>
            <span className={styles.insightIcon}>{insight.icon}</span>
            <span className={styles.insightText}>
              {getInsightText(insight)}
            </span>
            <span className={styles.insightStrength}>
              +{Math.round(insight.strength)}%
            </span>
          </div>
        ))}
      </div>
      
      {analysis.visualData.soundRadar && (
        <div className={styles.miniRadar}>
          <MiniSoundRadar data={analysis.visualData.soundRadar} />
        </div>
      )}
    </div>
  );
};

const InsightBadge = ({ insight }) => {
  return (
    <div className={`${styles.insightBadge} ${styles[insight.type]}`}>
      <div className={styles.insightHeader}>
        <span className={styles.insightIcon}>{insight.icon}</span>
        <span className={styles.insightStrength}>+{Math.round(insight.strength)}%</span>
      </div>
      <div className={styles.insightContent}>
        {getDetailedInsightContent(insight)}
      </div>
    </div>
  );
};

const SoundRadarChart = ({ data }) => {
  const chartData = data.eventProfile.map((item, index) => ({
    ...item,
    userValue: data.userProfile[index]?.value || 0,
    eventValue: item.value
  }));

  return (
    <div className={styles.radarContainer}>
      <ResponsiveContainer width="100%" height={200}>
        <RadarChart data={chartData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="feature" tick={{ fill: '#DADADA', fontSize: 10 }} />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]} 
            tick={{ fill: '#999', fontSize: 8 }}
            tickCount={5}
          />
          <Radar
            name="Your Taste"
            dataKey="userValue"
            stroke="#00FF88"
            fill="#00FF88"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Radar
            name="Event Profile"
            dataKey="eventValue"
            stroke="#00FFFF"
            fill="#00FFFF"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(21, 21, 31, 0.9)', 
              border: '1px solid #00FFFF',
              borderRadius: '8px',
              color: '#DADADA'
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
      <div className={styles.similarityScore}>
        <span>Similarity: {Math.round(data.similarity)}%</span>
      </div>
    </div>
  );
};

const MiniSoundRadar = ({ data }) => {
  const chartData = data.eventProfile.map((item, index) => ({
    ...item,
    userValue: data.userProfile[index]?.value || 0,
    eventValue: item.value
  }));

  return (
    <ResponsiveContainer width={80} height={80}>
      <RadarChart data={chartData}>
        <PolarGrid />
        <PolarAngleAxis dataKey="feature" tick={false} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} />
        <Radar
          dataKey="userValue"
          stroke="#00FF88"
          fill="#00FF88"
          fillOpacity={0.3}
          strokeWidth={1}
        />
        <Radar
          dataKey="eventValue"
          stroke="#00FFFF"
          fill="#00FFFF"
          fillOpacity={0.3}
          strokeWidth={1}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};

const MatchWheelChart = ({ data }) => {
  const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'];

  return (
    <div className={styles.wheelContainer}>
      <ResponsiveContainer width="100%" height={150}>
        <PieChart>
          <Pie
            data={data.segments}
            cx="50%"
            cy="50%"
            outerRadius={60}
            fill="#8884d8"
            dataKey="value"
            label={({ name, value }) => `${name}: ${Math.round(value)}%`}
          >
            {data.segments.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(21, 21, 31, 0.9)', 
              border: '1px solid #00FFFF',
              borderRadius: '8px',
              color: '#DADADA'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className={styles.overallScore}>
        Overall Match: {Math.round(data.totalScore)}%
      </div>
    </div>
  );
};

const ArtistNetworkDisplay = ({ data }) => {
  return (
    <div className={styles.networkDisplay}>
      <div className={styles.networkNodes}>
        {data.nodes.slice(0, 6).map(node => (
          <div 
            key={node.id} 
            className={`${styles.networkNode} ${styles[node.type]}`}
          >
            <div className={styles.nodeName}>{node.name}</div>
          </div>
        ))}
      </div>
      <div className={styles.networkConnections}>
        {data.links.slice(0, 3).map((link, index) => (
          <div key={index} className={styles.connectionInfo}>
            <span className={styles.connectionStrength}>
              {link.strength}% similar
            </span>
            <div className={styles.sharedGenres}>
              {link.sharedGenres?.slice(0, 2).join(', ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const GenreHeatmapDisplay = ({ data }) => {
  const maxIntensity = data.maxIntensity || 100;
  
  return (
    <div className={styles.heatmapDisplay}>
      <div className={styles.heatmapGrid}>
        {data.matrix.slice(0, 9).map((cell, index) => (
          <div 
            key={index}
            className={styles.heatmapCell}
            style={{ 
              backgroundColor: `rgba(0, 255, 255, ${cell.intensity / maxIntensity * 0.8})`,
              opacity: cell.intensity > 0 ? 1 : 0.3
            }}
          >
            <div className={styles.cellValue}>
              {cell.intensity > 0 ? Math.round(cell.intensity) : ''}
            </div>
          </div>
        ))}
      </div>
      <div className={styles.heatmapLegend}>
        <span>Event Genres vs Your Preferences</span>
      </div>
    </div>
  );
};

function getInsightText(insight) {
  switch (insight.type) {
    case 'direct_artist_match':
      return `${insight.artists.length} favorite artist${insight.artists.length > 1 ? 's' : ''}`;
    case 'similar_artist_match':
      return `${insight.correlations.length} similar artist${insight.correlations.length > 1 ? 's' : ''}`;
    case 'genre_affinity':
      return `${insight.genres.length} genre match${insight.genres.length > 1 ? 'es' : ''}`;
    case 'audio_dna_match':
      return `${insight.features.length} audio feature${insight.features.length > 1 ? 's' : ''}`;
    default:
      return 'Good match';
  }
}

function getDetailedInsightContent(insight) {
  switch (insight.type) {
    case 'direct_artist_match':
      return (
        <div>
          <div className={styles.artistList}>
            {insight.artists.map((artist, i) => (
              <span key={i} className={styles.artistName}>{artist.artist}</span>
            ))}
          </div>
        </div>
      );
    case 'similar_artist_match':
      return (
        <div>
          {insight.correlations.slice(0, 2).map((corr, i) => (
            <div key={i} className={styles.correlation}>
              <span className={styles.eventArtist}>{corr.eventArtist}</span>
              <span className={styles.similarity}>↔ {corr.similarity}%</span>
              <span className={styles.userArtist}>{corr.userArtist}</span>
            </div>
          ))}
        </div>
      );
    case 'genre_affinity':
      return (
        <div className={styles.genreList}>
          {insight.genres.map((genre, i) => (
            <span key={i} className={styles.genreMatch}>{genre.genre}</span>
          ))}
        </div>
      );
    case 'audio_dna_match':
      return (
        <div className={styles.featureList}>
          {insight.features.slice(0, 3).map((feature, i) => (
            <div key={i} className={styles.featureMatch}>
              <span className={styles.featureName}>{feature.feature}</span>
              <span className={styles.featureSimilarity}>
                {Math.round(feature.similarity * 100)}%
              </span>
            </div>
          ))}
        </div>
      );
    default:
      return null;
  }
}

export default TasteMatchVisuals;
