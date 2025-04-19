import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import styles from '../styles/SpiderChart.module.css';

const SpiderChart = ({ genres }) => {
  const chartRef = useRef(null);
  
  useEffect(() => {
    if (!genres || genres.length === 0 || !chartRef.current) return;
    
    // Clear previous chart
    d3.select(chartRef.current).selectAll("*").remove();
    
    // Chart dimensions
    const width = 400;
    const height = 400;
    const margin = 60;
    const radius = Math.min(width, height) / 2 - margin;
    
    // Create SVG
    const svg = d3.select(chartRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width/2}, ${height/2})`);
    
    // Scale for the radius
    const radialScale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, radius]);
    
    // Angle for each genre
    const angleSlice = (Math.PI * 2) / genres.length;
    
    // Create circular grid lines
    const gridLevels = 5;
    svg.selectAll(".gridCircle")
      .data(d3.range(1, gridLevels + 1).reverse())
      .enter()
      .append("circle")
      .attr("class", "gridCircle")
      .attr("r", d => radius / gridLevels * d)
      .style("fill", "none")
      .style("stroke", "rgba(255, 255, 255, 0.1)")
      .style("stroke-width", 1);
    
    // Create axis lines
    const axes = svg.selectAll(".axis")
      .data(genres)
      .enter()
      .append("g")
      .attr("class", "axis");
    
    axes.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", (d, i) => radialScale(100) * Math.cos(angleSlice * i - Math.PI/2))
      .attr("y2", (d, i) => radialScale(100) * Math.sin(angleSlice * i - Math.PI/2))
      .style("stroke", "rgba(255, 255, 255, 0.1)")
      .style("stroke-width", 1);
    
    // Add genre labels
    axes.append("text")
      .attr("class", styles.axisLabel)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("x", (d, i) => radialScale(110) * Math.cos(angleSlice * i - Math.PI/2))
      .attr("y", (d, i) => radialScale(110) * Math.sin(angleSlice * i - Math.PI/2))
      .text(d => d.name)
      .style("fill", "#00ffff")
      .style("font-size", "12px");
    
    // Create the radar chart path
    const radarLine = d3.lineRadial()
      .radius(d => radialScale(d.score))
      .angle((d, i) => i * angleSlice)
      .curve(d3.curveLinearClosed);
    
    // Draw the radar chart path
    svg.append("path")
      .datum(genres)
      .attr("class", styles.radarArea)
      .attr("d", radarLine)
      .style("fill", "rgba(255, 0, 255, 0.2)")
      .style("stroke", "#ff00ff")
      .style("stroke-width", 2);
    
    // Add data points
    svg.selectAll(".dataPoint")
      .data(genres)
      .enter()
      .append("circle")
      .attr("class", styles.dataPoint)
      .attr("cx", (d, i) => radialScale(d.score) * Math.cos(angleSlice * i - Math.PI/2))
      .attr("cy", (d, i) => radialScale(d.score) * Math.sin(angleSlice * i - Math.PI/2))
      .attr("r", 4)
      .style("fill", "#00ffff");
      
  }, [genres]);
  
  return (
    <div className={styles.spiderChartWrapper}>
      <div ref={chartRef} className={styles.spiderChart}></div>
    </div>
  );
};

export default SpiderChart;
