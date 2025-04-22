import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import styles from '@/styles/GenreRadarChart.module.css';

export default function GenreRadarChart({ genreData }) {
  const chartRef = useRef(null);
  const [size, setSize] = useState({ width: 300, height: 300 });
  
  // Handle responsive sizing
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        const containerWidth = chartRef.current.parentElement.clientWidth;
        // Determine size based on container width
        const chartSize = Math.min(300, containerWidth);
        setSize({ width: chartSize, height: chartSize });
      }
    };
    
    // Initialize
    handleResize();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Create/update chart when data or size changes
  useEffect(() => {
    if (!genreData || Object.keys(genreData).length === 0 || !chartRef.current) {
      return;
    }
    
    // Clear previous chart
    d3.select(chartRef.current).selectAll('*').remove();
    
    // Set dimensions
    const { width, height } = size;
    const margin = 30; // Buffer around the chart
    const radius = Math.min(width, height) / 2 - margin;
    
    // Create SVG container with viewBox for responsiveness
    const svg = d3.select(chartRef.current)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);
    
    // Add background blur effect
    const defs = svg.append('defs');
    
    // Create blur filter
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
      
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '2.5')
      .attr('result', 'coloredBlur');
      
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    
    // Add gradient for area
    const gradient = defs.append('linearGradient')
      .attr('id', 'areaGradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%');
      
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#00e5ff')
      .attr('stop-opacity', 0.8);
      
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#0099cc')
      .attr('stop-opacity', 0.8);
    
    // Process data
    const genres = Object.keys(genreData);
    const valueArray = Object.values(genreData);
    const angleSlice = (Math.PI * 2) / genres.length;
    
    // Scale for data
    const rScale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, radius]);
    
    // Draw grid lines
    const gridLevels = [20, 40, 60, 80, 100];
    
    // Add circular grid lines
    gridLevels.forEach(level => {
      svg.append('circle')
        .attr('r', rScale(level))
        .attr('class', styles.levelCircle)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(0, 255, 255, 0.1)')
        .attr('stroke-dasharray', '3,3');
    });
    
    // Draw the axes
    genres.forEach((genre, i) => {
      const angle = i * angleSlice;
      const lineCoords = {
        x: radius * Math.cos(angle - Math.PI / 2),
        y: radius * Math.sin(angle - Math.PI / 2)
      };
      
      // Draw axis line
      svg.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', lineCoords.x)
        .attr('y2', lineCoords.y)
        .attr('class', styles.axisLine)
        .attr('stroke', 'rgba(255, 255, 255, 0.15)');
      
      // Calculate label position - further out from the edge
      const labelDistance = radius * 1.15; // 15% outside the chart
      const labelCoords = {
        x: labelDistance * Math.cos(angle - Math.PI / 2),
        y: labelDistance * Math.sin(angle - Math.PI / 2)
      };
      
      // Determine text-anchor based on position
      let textAnchor = 'middle';
      if (angle < Math.PI * 0.25 || angle > Math.PI * 1.75) textAnchor = 'start';
      if (angle >= Math.PI * 0.75 && angle <= Math.PI * 1.25) textAnchor = 'end';
      
      // Add genre label
      svg.append('text')
        .attr('class', styles.axisLabel)
        .attr('x', labelCoords.x)
        .attr('y', labelCoords.y)
        .attr('dy', '0.35em') // Vertical centering
        .attr('text-anchor', textAnchor)
        .attr('fill', '#00e5ff')
        .style('font-size', '10px')
        .text(genre);
    });
    
    // Draw the radar chart
    // Map data points to coordinates
    const radarPoints = genres.map((genre, i) => {
      const value = genreData[genre];
      const angle = i * angleSlice;
      return {
        x: rScale(value) * Math.cos(angle - Math.PI / 2),
        y: rScale(value) * Math.sin(angle - Math.PI / 2),
        value: value,
        genre: genre
      };
    });
    
    // Create line generator for the path
    const lineGenerator = d3.line()
      .x(d => d.x)
      .y(d => d.y)
      .curve(d3.curveCardinalClosed.tension(0.7));
    
    // Draw the radar area
    svg.append('path')
      .datum(radarPoints)
      .attr('class', styles.radarArea)
      .attr('d', d => lineGenerator(d) + 'Z')
      .attr('fill', 'url(#areaGradient)')
      .attr('fill-opacity', 0.3)
      .attr('stroke', '#00e5ff')
      .attr('stroke-width', 2)
      .attr('filter', 'url(#glow)');
    
    // Add data points
    svg.selectAll('.radarPoint')
      .data(radarPoints)
      .enter()
      .append('circle')
      .attr('class', styles.dataPoint)
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', 4)
      .attr('fill', '#00e5ff')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);
    
    // We hide the percentage values by not rendering them at all
    // This is different from the original which showed values on the axes
  }, [genreData, size]);
  
  return (
    <div className={styles.container}>
      <div ref={chartRef} className={styles.chart}></div>
    </div>
  );
}