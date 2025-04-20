import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import styles from '@/styles/GenreRadarChart.module.css';

export default function GenreRadarChart({ genreData }) {
  const chartRef = useRef(null);
  const [chartDimensions, setChartDimensions] = useState({ width: 300, height: 300 });
  const [tooltipData, setTooltipData] = useState(null);
  
  // Handle window resize to make chart responsive
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        const containerWidth = chartRef.current.offsetWidth;
        // Force aspect ratio and ensure minimum size for mobile
        const minSize = 250;
        const maxSize = Math.min(containerWidth, 500);
        const size = Math.max(minSize, maxSize);
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
        top: Math.max(30, height * 0.1), 
        right: Math.max(30, width * 0.1), 
        bottom: Math.max(30, height * 0.1), 
        left: Math.max(30, width * 0.1) 
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
      
      // Add visual elements to increase clarity
      // Create clipping path for chart area
      svg.append('clipPath')
        .attr('id', 'chartAreaClip')
        .append('circle')
        .attr('r', radius);
      
      // Add glowing background
      const gradient = svg.append('defs')
        .append('radialGradient')
        .attr('id', 'chartBackground')
        .attr('cx', '50%')
        .attr('cy', '50%')
        .attr('r', '50%');
        
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', 'rgba(0, 255, 255, 0.1)');
        
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', 'rgba(0, 0, 0, 0)');
      
      svg.append('circle')
        .attr('r', radius)
        .attr('fill', 'url(#chartBackground)');
      
      // Draw background circles with better styling
      const circles = [20, 40, 60, 80, 100];
      svg.selectAll('.level-circle')
        .data(circles)
        .enter()
        .append('circle')
        .attr('class', styles.levelCircle)
        .attr('r', d => radiusScale(d))
        .attr('fill', 'none')
        .attr('stroke', 'rgba(0, 255, 255, 0.15)')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3');
      
      // Add circle indicators
      svg.selectAll('.level-indicator')
        .data(circles)
        .enter()
        .append('text')
        .attr('class', styles.levelIndicator)
        .attr('x', 5)
        .attr('y', d => -radiusScale(d) + 3)
        .attr('font-size', '8px')
        .attr('fill', 'rgba(255, 255, 255, 0.5)')
        .text(d => d);
      
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
        .attr('stroke', 'rgba(255, 255, 255, 0.15)')
        .attr('stroke-width', 1);
      
      // Enhanced label positioning - adjusted for mobile
      const labelRadius = radius * 1.15;
      
      // Draw labels with optimized positioning for different screen sizes
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
          if (angle > Math.PI * 0.25 && angle < Math.PI * 0.75) return '-0.5em';
          if (angle > Math.PI * 1.25 && angle < Math.PI * 1.75) return '1em';
          return '0.3em';
        })
        .text(d => d)
        .attr('fill', '#00ffff')
        .attr('font-size', width < 350 ? '10px' : '12px')
        .attr('font-weight', '500')
        .on('mouseover', function(event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('font-size', width < 350 ? '12px' : '14px')
            .attr('fill', '#ff00ff');
        })
        .on('mouseout', function(event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('font-size', width < 350 ? '10px' : '12px')
            .attr('fill', '#00ffff');
        });
      
      // Create data points
      const points = genres.map((genre, i) => {
        const value = values[i];
        return {
          genre,
          value,
          x: radiusScale(value) * Math.cos(angleScale(i) - Math.PI/2),
          y: radiusScale(value) * Math.sin(angleScale(i) - Math.PI/2),
        };
      });
      
      // Create line generator
      const lineGenerator = d3.line()
        .x(d => d.x)
        .y(d => d.y)
        .curve(d3.curveCardinalClosed.tension(0.5));
      
      // Add gradient for the radar area
      const areaGradient = svg.append('defs')
        .append('linearGradient')
        .attr('id', 'areaGradient')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '100%');
        
      areaGradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', 'rgba(0, 255, 255, 0.6)');
        
      areaGradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', 'rgba(102, 16, 242, 0.6)');
      
      // Add blur filter for glow effect
      const filter = svg.append('defs')
        .append('filter')
        .attr('id', 'glow');
        
      filter.append('feGaussianBlur')
        .attr('stdDeviation', '2.5')
        .attr('result', 'coloredBlur');
        
      const feMerge = filter.append('feMerge');
      feMerge.append('feMergeNode')
        .attr('in', 'coloredBlur');
      feMerge.append('feMergeNode')
        .attr('in', 'SourceGraphic');
      
      // Draw shape with enhanced styling
      svg.append('path')
        .datum(points)
        .attr('d', d => lineGenerator(d) + 'Z')
        .attr('class', styles.radarArea)
        .attr('fill', 'url(#areaGradient)')
        .attr('fill-opacity', 0.3)
        .attr('stroke', 'url(#areaGradient)')
        .attr('stroke-width', 2)
        .attr('filter', 'url(#glow)');
      
      // Draw data points with interactions
      svg.selectAll('.data-point')
        .data(points)
        .enter()
        .append('circle')
        .attr('class', styles.dataPoint)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('r', width < 350 ? 4 : 5)
        .attr('fill', '#00ffff')
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .on('mouseover', function(event, d) {
          // Highlight point
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', width < 350 ? 6 : 8)
            .attr('fill', '#ff00ff');
          
          // Show tooltip data
          setTooltipData({
            genre: d.genre,
            value: d.value,
            x: event.pageX,
            y: event.pageY
          });
        })
        .on('mouseout', function() {
          // Reset point
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', width < 350 ? 4 : 5)
            .attr('fill', '#00ffff');
          
          // Hide tooltip
          setTooltipData(null);
        });
    }
  }, [genreData, chartDimensions]);
  
  return (
    <div className={styles.chartContainer}>
      <div ref={chartRef} className={styles.chart}></div>
      {tooltipData && (
        <div 
          className={styles.tooltip} 
          style={{ 
            left: tooltipData.x + 'px', 
            top: tooltipData.y + 'px' 
          }}
        >
          <strong>{tooltipData.genre}</strong>: {tooltipData.value}%
        </div>
      )}
    </div>
  );
}