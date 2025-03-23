/**
 * XP Chart Component
 * Creates an interactive SVG chart showing XP progress over time
 */
import { createSVGElement, createSVGContainer, createAxes, addAxisTicks, createScales, createSVGTooltip } from '../utils/svgHelpers.js';
import { formatDate, formatNumber } from '../utils/domHelpers.js';

export function createXPLineChart(xpData, container, options = {}) {
  // Clear container
  container.innerHTML = '';
  
  // Default options
  const opts = {
    width: 800,
    height: 400,
    padding: 50,
    color: 'var(--secondary)',
    animated: true,
    ...options
  };
  
  // Dimensions
  const dimensions = {
    width: opts.width,
    height: opts.height,
    padding: opts.padding
  };
  
  // Create SVG container
  const { svg, dimensions: svgDimensions } = createSVGContainer(dimensions.width, dimensions.height, dimensions.padding);
  container.appendChild(svg);
  
  // Set up scales for mapping data to coordinates
  const scales = createScales(
    xpData,
    dimensions,
    {
      xAccessor: d => new Date(d.date),
      yAccessor: d => d.cumulativeAmount,
      xDomain: [
        new Date(xpData[0].date),
        new Date(xpData[xpData.length - 1].date)
      ],
      yDomain: [0, Math.ceil(Math.max(...xpData.map(d => d.cumulativeAmount)) * 1.05)] // Start from 0 and add 5% padding
    }
  );
  
  const { xScale, yScale } = scales;
  
  // Create axes
  const axisGroups = createAxes(svg, dimensions, {
    xLabel: 'Date',
    yLabel: 'XP',
    gridLines: true,
    xTickFormat: (date) => {
      // Format date as month/year
      if (date instanceof Date) {
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      }
      return date;
    },
    yTickFormat: (value) => formatNumber(value)
  });
  
  // Add tick marks to axes
  addAxisTicks(
    axisGroups,
    {
      xScale: value => xScale(new Date(value)),
      yScale
    },
    dimensions,
    {
      xTickValues: xpData
        .filter((d, i, arr) => {
          // Show only specific ticks to avoid overcrowding
          const totalPoints = arr.length;
          // Always show first and last points
          if (i === 0 || i === totalPoints - 1) return true;
          // Show approximately 4-6 points in between
          const interval = Math.max(1, Math.floor(totalPoints / 5));
          return i % interval === 0;
        })
        .map(d => new Date(d.date)),
      yTickValues: (() => {
        const max = Math.max(...xpData.map(d => d.cumulativeAmount));
        const step = Math.ceil(max / 5); // Create 5 evenly distributed ticks
        return Array.from({ length: 6 }, (_, i) => i * step);
      })(),
      xTickFormat: (d, i, arr) => {
        // Safely handle undefined values
        if (!d) return '';
        
        const isFirst = i === 0;
        const isLast = arr && i === arr.length - 1;
        
        // First and last ticks: show month and year
        if (isFirst || isLast) {
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
        
        // Middle ticks: show only month and day
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      },
      yTickFormat: v => (v / 1000).toFixed(2) + 'kB'
    }
  );
  
  // Create a line generator
  const line = createSVGElement('path', {
    fill: 'none',
    stroke: opts.color,
    'stroke-width': 3,
    'stroke-linejoin': 'round',
    'stroke-linecap': 'round'
  });
  
  // Generate the line path
  const pathData = xpData.map((d, i) => {
    const x = xScale(new Date(d.date));
    const y = yScale(d.cumulativeAmount);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  
  line.setAttribute('d', pathData);
  
  // Add animation if enabled
  if (opts.animated) {
    const pathLength = line.getTotalLength();
    
    line.setAttribute('stroke-dasharray', pathLength);
    line.setAttribute('stroke-dashoffset', pathLength);
    
    line.style.animation = 'dash 1.5s ease-in-out forwards';
    
    // Define the animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes dash {
        to {
          stroke-dashoffset: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  svg.appendChild(line);
  
  // Create area under the line
  const area = createSVGElement('path', {
    fill: opts.color,
    'fill-opacity': 0.1,
    stroke: 'none'
  });
  
  // Generate the area path
  const areaPathData = xpData.map((d, i) => {
    const x = xScale(new Date(d.date));
    const y = yScale(d.cumulativeAmount);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ') + 
  ` L ${xScale(new Date(xpData[xpData.length - 1].date))} ${yScale(0)} L ${xScale(new Date(xpData[0].date))} ${yScale(0)} Z`;
  
  area.setAttribute('d', areaPathData);
  
  // Add area before the line
  svg.insertBefore(area, line);
  
  // Create data points
  const dataPointsGroup = createSVGElement('g', {
    class: 'data-points'
  });
  
  // Create tooltip
  const tooltip = createSVGTooltip(svg);
  
  // Add data points with interactions
  xpData.forEach((d, i) => {
    if (i % Math.max(1, Math.floor(xpData.length / 20)) !== 0 && i !== xpData.length - 1) {
      return; // Skip some points to avoid overcrowding
    }
    
    const x = xScale(new Date(d.date));
    const y = yScale(d.cumulativeAmount);
    
    const point = createSVGElement('circle', {
      cx: x,
      cy: y,
      r: 6,
      fill: 'var(--primary-dark)',
      stroke: opts.color,
      'stroke-width': 2,
      'fill-opacity': 0.7,
      class: 'data-point'
    });
    
    // Add hover effects and tooltip
    point.addEventListener('mouseover', () => {
      point.setAttribute('r', 8);
      point.setAttribute('fill-opacity', 1);
      
      // Show tooltip with XP info
      const tooltipText = `
        ${formatDate(d.date)}
        Daily XP: ${formatNumber(((d.amount)/1000).toFixed(2))} kB
      `;
      tooltip.show(x, y, tooltipText);
    });
    
    point.addEventListener('mouseout', () => {
      point.setAttribute('r', 6);
      point.setAttribute('fill-opacity', 0.7);
      tooltip.hide();
    });
    
    dataPointsGroup.appendChild(point);
  });
  
  svg.appendChild(dataPointsGroup);
  
  // Add title
  const title = createSVGElement('text', {
    x: dimensions.width / 2,
    y: 25,
    'text-anchor': 'middle',
    'font-size': '18px',
    fill: 'var(--tertiary)',
    class: 'chart-title'
  });
  title.textContent = 'XP Progression Over Time';
  
  svg.appendChild(title);
  
  return {
    svg,
    scales,
    tooltip
  };
}

/**
 * Create a bar chart for XP by project
 * @param {Array} projectsData - Array of XP by project
 * @param {HTMLElement} container - Container element
 * @param {Object} options - Chart options
 * @returns {Object} Chart components
 */
export function createXPBarChart(projectsData, container, options = {}) {
  // Print data for debugging
  console.log('Creating XP bar chart with data:', projectsData);
  
  // Clear container
  container.innerHTML = '';
  
  // Default options
  const opts = {
    width: 800,
    height: 400,
    padding: 50,
    barColor: 'var(--secondary)',
    animated: true,
    maxBars: 10,
    ...options
  };
  
  // Limit number of bars to display
  const limitedData = projectsData.slice(0, opts.maxBars);
  
  // Process data to handle missing fields
  const processedData = limitedData.map(d => ({
    name: d.project || d.name || 'Unknown Project',
    amount: d.amount || 0
  }));
  
  console.log('Processed data:', processedData);
  
  // Dimensions
  const dimensions = {
    width: opts.width,
    height: opts.height,
    padding: opts.padding
  };
  
  // Create SVG container
  const { svg, dimensions: svgDimensions } = createSVGContainer(dimensions.width, dimensions.height, dimensions.padding);
  container.appendChild(svg);
  
  // Create tooltip
  const tooltip = createSVGTooltip(svg);
  
  // Bar width based on data length
  const barWidth = Math.min(
    60,
    (dimensions.width - 2 * dimensions.padding) / processedData.length - 10
  );
  
  // Set up scales
  const xScale = i => dimensions.padding + 35 + i * ((dimensions.width - 2 * dimensions.padding - 20) / (processedData.length - 1 || 1));
  xScale.domain = () => [0, processedData.length - 1];
  xScale.range = () => [dimensions.padding + 35, dimensions.width - dimensions.padding];
  
  const maxAmount = Math.max(...processedData.map(d => d.amount), 0);
  const yScale = amount => dimensions.height - dimensions.padding - (amount / maxAmount) * (dimensions.height - 2 * dimensions.padding);
  yScale.domain = () => [0, maxAmount];
  yScale.range = () => [dimensions.height - dimensions.padding, dimensions.padding];
  
  // Create axes
  const { xAxisGroup, yAxisGroup } = createAxes(svg, dimensions, {
    xLabel: '',
    yLabel: 'XP',
    yTickFormat: value => formatNumber(value)
  });
  
  // Add ticks to y-axis only (x-axis will have custom labels)
  addAxisTicks(
    { xAxisGroup, yAxisGroup },
    { xScale, yScale },
    dimensions,
    {
      xTicks: 0, // No x-axis ticks
      yTicks: 5,
      yTickFormat: value => (value / 1000).toFixed(2) + 'kB',
      gridLines: true
    }
  );
  
  // Create bars group
  const barsGroup = createSVGElement('g', {
    class: 'bars'
  });
  
  processedData.forEach((d, i) => {
    const x = xScale(i) - barWidth / 2;
    const barHeight = dimensions.height - dimensions.padding - yScale(d.amount);
    const y = yScale(d.amount);
    
    // Create bar
    const bar = createSVGElement('rect', {
      x,
      y: y,
      width: barWidth,
      height: 0, // Start with height 0 for animation
      fill: opts.barColor,
      rx: 3,
      ry: 3,
      'fill-opacity': 0.7,
      class: 'bar'
    });
    
    // Add animation
    if (opts.animated) {
      bar.style.transition = `height 1s ease-out ${i * 0.1}s`;
      setTimeout(() => {
        bar.setAttribute('height', barHeight);
      }, 10);
    } else {
      bar.setAttribute('height', barHeight);
    }
    
    // Add hover effects and tooltip
    bar.addEventListener('mouseover', () => {
      bar.setAttribute('fill-opacity', 1);
      tooltip.show(x + barWidth / 2, y, `${d.name}: ${formatNumber(((d.amount)/1000).toFixed(2))} kB`);
    });
    
    bar.addEventListener('mouseout', () => {
      bar.setAttribute('fill-opacity', 0.7);
      tooltip.hide();
    });
    
    barsGroup.appendChild(bar);
    
    // Add project labels with consistent rotation to prevent cluttering
    const label = createSVGElement('text', {
      x: xScale(i),
      y: dimensions.height - dimensions.padding + 15,
      'text-anchor': 'end',
      'font-size': '9px',
      fill: 'var(--tertiary-dark)',
      transform: `rotate(-45, ${xScale(i)}, ${dimensions.height - dimensions.padding + 15})` 
    });
    
    // Shorten project name if too long
    const projectName = d.name.length > 10 ? d.name.substring(0, 10) + '...' : d.name;
    label.textContent = projectName;
    
    // Add label to bars group instead of xAxisGroup to keep it within container
    barsGroup.appendChild(label);
  });
  
  svg.appendChild(barsGroup);
  
  // Add title
  const title = createSVGElement('text', {
    x: dimensions.width / 2,
    y: 25,
    'text-anchor': 'middle',
    'font-size': '18px',
    fill: 'var(--tertiary)',
    class: 'chart-title'
  });
  title.textContent = 'XP by Project';
  
  svg.appendChild(title);
  
  return {
    svg,
    tooltip
  };
} 