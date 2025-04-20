import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import styles from '@/styles/GenreRadarChart.module.css';

export default function GenreRadarChart({ genreData }) {
  const chartRef = useRef(null);
  const [chartDimensions, setChartDimensions] = useState({ width: 300, height: 300 });
  
  // Handle window resize to make chart responsive
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        const containerWidth = chartRef.current.offsetWidth;
        // Make chart square but not larger than container or too small on mobile
        const size = Math.min(Math.max(containerWidth, 250), 500);
        setChartDimensions({ width: size, height: size });
      }
    };
    
    // Set initial dimensions
    handleResize();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  useEffect(() => {
    if (genreData && Object.keys(genreData).length > 0 && chartRef.current) {
      // Clear any existing chart
      d3.select(chartRef.current).selectAll('*').remove();
      
      // Set up dimensions
      const { width, height } = chartDimensions;
      const margin = { 
        top: Math.max(20, height * 0.07), 
        right: Math.max(20, width * 0.07), 
        bottom: Math.max(20, height * 0.07), 
        left: Math.max(20, width * 0.07) 
      };
      const chartWidth = width - margin.left - margin.right;
      const chartHeight = height - margin.top - margin.bottom;
      const radius = Math.min(chartWidth, chartHeight) / 2;
      
      // Create SVG
      const svg = d3.select(chartRef.current)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .append('g')
        .attr('transform', `translate(${width/2}, ${height/2})`);
      
      // Extract data
      const genres = Object.keys(genreData);
      const values = Object.values(genreData);
      const total = genres.length;
      
      // Set up scales
      const angleScale = d3.scaleLinear()
        .domain([0, total])
        .range([0, Math.PI * 2]);
      
      const radiusScale = d3.scaleLinear()
        .domain([0, 100])
        .range([0, radius]);
      
      // Draw background circles
      const circles = [20, 40, 60, 80, 100];
      svg.selectAll('.level-circle')
        .data(circles)
        .enter()
        .append('circle')
        .attr('class', styles.levelCircle)
        .attr('r', d => radiusScale(d))
        .attr('fill', 'none')
        .attr('stroke', 'rgba(0, 255, 255, 0.1)')
        .attr('stroke-width', 1);
      
      // Draw axis lines
      svg.selectAll('.axis-line')
        .data(genres)
        .enter()
        .append('line')
        .attr('class', styles.axisLine)
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', (d, i) => radiusScale(100) * Math.cos(angleScale(i) - Math.PI/2))
        .attr('y2', (d, i) => radiusScale(100) * Math.sin(angleScale(i) - Math.PI/2))
        .attr('stroke', 'rgba(255, 255, 255, 0.2)')
        .attr('stroke-width', 1);
      
      // Adjust label positioning based on screen size
      const labelRadius = radius * 1.15;
      
      // Draw labels with better positioning
      svg.selectAll('.axis-label')
        .data(genres)
        .enter()
        .append('text')
        .attr('class', styles.axisLabel)
        .attr('x', (d, i) => labelRadius * Math.cos(angleScale(i) - Math.PI/2))
        .attr('y', (d, i) => labelRadius * Math.sin(angleScale(i) - Math.PI/2))
        .attr('text-anchor', (d, i) => {
          const angle = angleScale(i);
          if (angle < Math.PI * 0.25 || angle > Math.PI * 1.75) return 'start';
          if (angle >= Math.PI * 0.75 && angle <= Math.PI * 1.25) return 'end';
          return 'middle';
        })
        .attr('dominant-baseline', (d, i) => {
          const angle = angleScale(i);
          if (angle <= Math.PI * 0.5 || angle >= Math.PI * 1.5) return 'auto';
          return 'hanging';
        })
        .attr('dy', (d, i) => {
          const angle = angleScale(i);
          // Fine-tune vertical alignment
          if (angle > Math.PI * 0.25 && angle < Math.PI * 0.75) return '-0.5em';
          if (angle > Math.PI * 1.25 && angle < Math.PI * 1.75) return '1em';
          return '0.3em';
        })
        .text(d => d)
        .attr('fill', '#00ffff')
        .attr('font-size', width < 350 ? '10px' : '12px');
      
      // Create data points
      const points = genres.map((genre, i) => {
        const value = values[i];
        return {
          x: radiusScale(value) * Math.cos(angleScale(i) - Math.PI/2),
          y: radiusScale(value) * Math.sin(angleScale(i) - Math.PI/2),
          value
        };
      });
      
      // Create line generator
      const lineGenerator = d3.line()
        .x(d => d.x)
        .y(d => d.y)
        .curve(d3.curveCardinalClosed.tension(0.5));
      
      // Draw shape
      svg.append('path')
        .attr('d', lineGenerator(points) + 'Z')
        .attr('class', styles.radarArea)
        .attr('fill', 'rgba(0, 255, 255, 0.2)')
        .attr('stroke', '#00ffff')
        .attr('stroke-width', 2)
        .attr('filter', 'url(#glow)');
      
      // Add glow filter
      const defs = svg.append('defs');
      const filter = defs.append('filter')
        .attr('id', 'glow');
      
      filter.append('feGaussianBlur')
        .attr('stdDeviation', '2.5')
        .attr('result', 'coloredBlur');
      
      const feMerge = filter.append('feMerge');
      feMerge.append('feMergeNode')
        .attr('in', 'coloredBlur');
      feMerge.append('feMergeNode')
        .attr('in', 'SourceGraphic');
      
      // Draw points
      svg.selectAll('.data-point')
        .data(points)
        .enter()
        .append('circle')
        .attr('class', styles.dataPoint)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('r', width < 350 ? 3 : 4)
        .attr('fill', '#00ffff')
        .attr('stroke', '#fff')
        .attr('stroke-width', 1);
    }
  }, [genreData, chartDimensions]);
  
  return (
    <div ref={chartRef} className={styles.chart}></div>
  );
}