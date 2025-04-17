import React, { useEffect, useRef } from 'react';
import styles from '../styles/SpiderChart.module.css';

const SpiderChart = ({ genres = [] }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    if (!canvasRef.current || !Array.isArray(genres) || genres.length === 0) {
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions with higher resolution for better text rendering
    const canvasWidth = canvas.offsetWidth;
    const canvasHeight = canvas.offsetHeight;
    canvas.width = canvasWidth * 2;
    canvas.height = canvasHeight * 2;
    ctx.scale(2, 2);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    try {
      drawSpiderChart(ctx, canvasWidth, canvasHeight, genres);
    } catch (error) {
      console.error('Error drawing spider chart:', error);
      drawErrorState(ctx, canvasWidth, canvasHeight);
    }
  }, [genres]);
  
  const drawSpiderChart = (ctx, width, height, genres) => {
    // Normalize data for display
    const normalizedGenres = genres.map(genre => {
      const name = typeof genre === 'string' ? genre : (genre.name || 'Unknown');
      const value = typeof genre === 'object' && genre.value !== undefined ? 
                   genre.value : 
                   (typeof genre === 'object' && genre.score !== undefined ? 
                   genre.score : 50);
      return { name, value: Math.min(Math.max(value, 0), 100) };
    });
    
    // Calculate center and radius
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) * 0.8;
    
    // Calculate points for each genre
    const points = [];
    const numPoints = normalizedGenres.length;
    
    if (numPoints < 3) {
      throw new Error('Not enough genres to draw a spider chart');
    }
    
    // Draw background web
    drawWeb(ctx, centerX, centerY, radius, numPoints);
    
    // Calculate and draw data points
    for (let i = 0; i < numPoints; i++) {
      const angle = (Math.PI * 2 * i) / numPoints - Math.PI / 2;
      const value = normalizedGenres[i].value / 100;
      const x = centerX + radius * value * Math.cos(angle);
      const y = centerY + radius * value * Math.sin(angle);
      points.push({ x, y });
    }
    
    // Draw data shape
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.lineTo(points[0].x, points[0].y);
    ctx.fillStyle = 'rgba(0, 212, 255, 0.2)';
    ctx.fill();
    
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00d4ff';
    ctx.stroke();
    
    // Draw data points
    for (const point of points) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#00d4ff';
      ctx.fill();
    }
    
    // Draw genre labels with improved positioning and wrapping
    for (let i = 0; i < numPoints; i++) {
      const angle = (Math.PI * 2 * i) / numPoints - Math.PI / 2;
      const labelRadius = radius * 1.15; // Position labels slightly outside the web
      const x = centerX + labelRadius * Math.cos(angle);
      const y = centerY + labelRadius * Math.sin(angle);
      
      // Adjust text alignment based on position
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Adjust horizontal alignment based on angle
      if (angle > Math.PI / 4 && angle < Math.PI * 3 / 4) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
      } else if (angle >= Math.PI * 3 / 4 && angle < Math.PI * 5 / 4) {
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
      } else if (angle >= Math.PI * 5 / 4 && angle < Math.PI * 7 / 4) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
      } else {
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
      }
      
      // Draw text with better visibility
      const genreName = normalizedGenres[i].name;
      ctx.font = 'bold 12px Arial';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillText(genreName, x + 1, y + 1); // Shadow for better readability
      ctx.fillStyle = '#00d4ff';
      ctx.fillText(genreName, x, y);
    }
  };
  
  const drawWeb = (ctx, centerX, centerY, radius, numPoints) => {
    // Draw concentric circles
    const numCircles = 4;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    for (let i = 1; i <= numCircles; i++) {
      const circleRadius = (radius * i) / numCircles;
      ctx.beginPath();
      ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Draw lines from center to each point
    for (let i = 0; i < numPoints; i++) {
      const angle = (Math.PI * 2 * i) / numPoints - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };
  
  const drawErrorState = (ctx, width, height) => {
    ctx.fillStyle = 'rgba(255, 107, 107, 0.2)';
    ctx.fillRect(0, 0, width, height);
    
    ctx.font = '14px Arial';
    ctx.fillStyle = '#ff6b6b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Error displaying genre chart', width / 2, height / 2);
  };
  
  return (
    <div className={styles.spiderChartContainer}>
      <canvas 
        ref={canvasRef} 
        className={styles.spiderChart}
        width="300"
        height="300"
      />
      {(!Array.isArray(genres) || genres.length === 0) && (
        <div className={styles.noDataOverlay}>
          <p>No genre data available</p>
        </div>
      )}
    </div>
  );
};

export default SpiderChart;
