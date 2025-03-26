/**
 * Audit Chart Component
 * Creates visualizations for audit data
 */
import { createSVGElement, createSVGContainer, createAxes, createScales, createSVGTooltip } from '../utils/svgHelpers.js';

/**
 * Create an audit ratio chart
 * @param {Object} auditData - Processed audit data
 * @param {HTMLElement} container - Container for the chart
 * @param {Object} options - Chart options
 */
export function createAuditRatioChart(auditData, container, options = {}) {
  // Clear container
  container.innerHTML = '';
  
  // Set default options
  const defaults = {
    width: container.clientWidth || 400,
    height: 300,
    padding: 40,
    doneColor: 'var(--chart-color-1)',
    receivedColor: 'var(--chart-color-4)',
    animate: true,
    animationDuration: 1000
  };
  
  const opts = { ...defaults, ...options };
  
  // Create SVG container
  const { svg, dimensions } = createSVGContainer(opts.width, opts.height, opts.padding);
  
  // Check if SVG is valid before continuing
  if (!svg || typeof svg.appendChild !== 'function') {
    const errorMessage = document.createElement('div');
    errorMessage.className = 'chart-error';
    errorMessage.textContent = 'Error: Failed to create SVG chart';
    container.appendChild(errorMessage);
    return;
  }
  
  container.appendChild(svg);
  
  // Add title
  const title = createSVGElement('text', {
    x: dimensions.width / 2,
    y: 20,
    'text-anchor': 'middle',
    'font-size': '16px',
    'font-weight': 'bold',
    fill: 'var(--text-color)',
    class: 'chart-title'
  });
  title.textContent = 'Audit Ratio History';
  svg.appendChild(title);
  
  // Ensure auditData is properly structured
  const data = Array.isArray(auditData) 
    ? auditData 
    : (auditData && Array.isArray(auditData.history)) 
      ? auditData.history 
      : [];
      
  // If no data, show message
  if (data.length === 0) {
    const noDataText = createSVGElement('text', {
      x: dimensions.width / 2,
      y: dimensions.height / 2,
      'text-anchor': 'middle',
      'font-size': '14px',
      fill: 'var(--text-color)',
      opacity: 0.7
    });
    noDataText.textContent = 'No audit data available';
    svg.appendChild(noDataText);
    return;
  }
  
  // Create scales
  const scales = createScales(
    data, 
    dimensions, 
    {
      xAccessor: d => d.date,
      yAccessor: d => d.ratio,
      yDomain: [0, Math.max(2, Math.ceil(Math.max(...data.map(d => d.ratio))))]
    }
  );
  
  // Create axes
  createAxes(
    svg, 
    dimensions, 
    {
      xScale: scales.xScale,
      yScale: scales.yScale,
      xAxisLabel: 'Date',
      yAxisLabel: 'Ratio',
      xTickFormat: date => {
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      },
      yTickFormat: value => value.toFixed(1)
    }
  );
  
  // Create tooltip
  const tooltip = createSVGTooltip(svg);
  
  // Add ratio reference line at 1.0
  const referenceLine = createSVGElement('line', {
    x1: dimensions.padding,
    y1: scales.yScale(1),
    x2: dimensions.width - dimensions.padding,
    y2: scales.yScale(1),
    stroke: 'var(--text-color)',
    'stroke-width': 1,
    'stroke-dasharray': '5,5',
    opacity: 0.5
  });
  svg.appendChild(referenceLine);
  
  // Add reference text
  const referenceText = createSVGElement('text', {
    x: dimensions.width - dimensions.padding + 5,
    y: scales.yScale(1) - 5,
    'font-size': '12px',
    fill: 'var(--text-color)',
    opacity: 0.7
  });
  referenceText.textContent = 'Target';
  svg.appendChild(referenceText);
  
  // Create line for ratio
  const linePath = createSVGElement('path', {
    fill: 'none',
    stroke: opts.doneColor,
    'stroke-width': 2,
    'stroke-linejoin': 'round',
    'stroke-linecap': 'round'
  });
  
  // Generate path data
  let pathData = '';
  data.forEach((d, i) => {
    const x = scales.xScale(d.date);
    const y = scales.yScale(d.ratio);
    pathData += (i === 0 ? 'M' : 'L') + x + ',' + y;
  });
  
  linePath.setAttribute('d', pathData);
  svg.appendChild(linePath);
  
  // Add animation if enabled
  if (opts.animate) {
    const pathLength = linePath.getTotalLength();
    linePath.style.strokeDasharray = pathLength;
    linePath.style.strokeDashoffset = pathLength;
    linePath.style.transition = `stroke-dashoffset ${opts.animationDuration}ms ease`;
    
    // Trigger animation
    setTimeout(() => {
      linePath.style.strokeDashoffset = 0;
    }, 10);
  }
  
  // Add data points with tooltips
  data.forEach(d => {
    const x = scales.xScale(d.date);
    const y = scales.yScale(d.ratio);
    
    const circle = createSVGElement('circle', {
      cx: x,
      cy: y,
      r: 5,
      fill: opts.doneColor,
      stroke: 'var(--primary)',
      'stroke-width': 1,
      cursor: 'pointer'
    });
    
    // Add tooltip events
    circle.addEventListener('mouseenter', () => {
      circle.setAttribute('r', 7);
      
      const date = d.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      tooltip.show(x, y, `${date}\nDone: ${d.done}\nReceived: ${d.received}\nRatio: ${d.ratio.toFixed(2)}`);
    });
    
    circle.addEventListener('mouseleave', () => {
      circle.setAttribute('r', 5);
      tooltip.hide();
    });
    
    svg.appendChild(circle);
  });
  
  // Add legend
  const legend = createSVGElement('g', {
    transform: `translate(${dimensions.padding}, ${dimensions.height - 10})`
  });
  
  const legendItem = createSVGElement('g', {});
  
  const legendColor = createSVGElement('rect', {
    x: 0,
    y: -10,
    width: 12,
    height: 12,
    fill: opts.doneColor
  });
  
  const legendText = createSVGElement('text', {
    x: 20,
    y: 0,
    'font-size': '12px',
    fill: 'var(--text-color)'
  });
  legendText.textContent = 'Audit Ratio';
  
  legendItem.appendChild(legendColor);
  legendItem.appendChild(legendText);
  legend.appendChild(legendItem);
  svg.appendChild(legend);
}

/**
 * Create an audit comparison bar chart
 * @param {Object} auditData - Processed audit data
 * @param {HTMLElement} container - Container for the chart
 * @param {Object} options - Chart options
 */
export function createAuditComparisonChart(auditData, container, options = {}) {
  // Clear container
  container.innerHTML = '';
  
  // Set default options
  const defaults = {
    width: container.clientWidth || 400,
    height: 300,
    padding: 40,
    doneColor: 'var(--chart-color-1)',
    receivedColor: 'var(--chart-color-4)',
    barPadding: 0.2,
    animate: true,
    animationDuration: 1000
  };
  
  const opts = { ...defaults, ...options };
  
  // Create SVG container
  const { svg, dimensions } = createSVGContainer(opts.width, opts.height, opts.padding);
  container.appendChild(svg);
  
  // Add title
  const title = createSVGElement('text', {
    x: dimensions.width / 2,
    y: 20,
    'text-anchor': 'middle',
    'font-size': '16px',
    'font-weight': 'bold',
    fill: 'var(--text-color)',
    class: 'chart-title'
  });
  title.textContent = 'Audits Done vs. Received';
  svg.appendChild(title);
  
  // Get the history data from auditData
  const historyData = Array.isArray(auditData) 
    ? auditData 
    : (auditData && Array.isArray(auditData.history)) 
      ? auditData.history 
      : [];
      
  // If no data, show message
  if (historyData.length === 0) {
    const noDataText = createSVGElement('text', {
      x: dimensions.width / 2,
      y: dimensions.height / 2,
      'text-anchor': 'middle',
      'font-size': '14px',
      fill: 'var(--text-color)',
      opacity: 0.7
    });
    noDataText.textContent = 'No audit data available';
    svg.appendChild(noDataText);
    return;
  }
  
  // Get the last few months (up to 5)
  const recentData = historyData
    .sort((a, b) => b.date - a.date)
    .slice(0, 5)
    .reverse();
  
  // Create tooltip
  const tooltip = createSVGTooltip(svg);
  
  // Set up scales for bar chart
  const xScale = d3Scale => {
    const domain = recentData.map(d => d.date);
    const range = [dimensions.padding, dimensions.width - dimensions.padding];
    
    // Simple scale for categorical data
    return {
      domain,
      range,
      scale: value => {
        const index = domain.findIndex(d => d.getTime() === value.getTime());
        if (index === -1) return range[0];
        
        const step = (range[1] - range[0]) / domain.length;
        return range[0] + (index * step) + (step / 2);
      },
      bandwidth: () => (range[1] - range[0]) / domain.length * (1 - opts.barPadding)
    };
  };
  
  const xAxis = xScale();
  
  // Find max value for y-scale
  const maxValue = Math.max(
    ...recentData.map(d => Math.max(d.done, d.received))
  );
  
  const yScale = d3Scale => {
    return {
      domain: [0, maxValue * 1.1], // Add 10% padding
      range: [dimensions.height - dimensions.padding, dimensions.padding],
      scale: value => {
        const [domainMin, domainMax] = [0, maxValue * 1.1];
        const [rangeMin, rangeMax] = [dimensions.height - dimensions.padding, dimensions.padding];
        
        return rangeMax + (1 - (value - domainMin) / (domainMax - domainMin)) * (rangeMin - rangeMax);
      }
    };
  };
  
  const yAxis = yScale();
  
  // Draw X axis
  const xAxisGroup = createSVGElement('g', {
    transform: `translate(0, ${dimensions.height - dimensions.padding})`
  });
  
  // X axis line
  const xAxisLine = createSVGElement('line', {
    x1: dimensions.padding,
    y1: 0,
    x2: dimensions.width - dimensions.padding,
    y2: 0,
    stroke: 'var(--text-color)',
    'stroke-width': 1,
    opacity: 0.5
  });
  
  xAxisGroup.appendChild(xAxisLine);
  
  // X axis labels
  recentData.forEach(d => {
    const x = xAxis.scale(d.date);
    
    const tick = createSVGElement('text', {
      x,
      y: 20,
      'text-anchor': 'middle',
      'font-size': '12px',
      fill: 'var(--text-color)',
      opacity: 0.7
    });
    
    tick.textContent = d.date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    xAxisGroup.appendChild(tick);
  });
  
  svg.appendChild(xAxisGroup);
  
  // Draw Y axis
  const yAxisGroup = createSVGElement('g', {
    transform: `translate(${dimensions.padding}, 0)`
  });
  
  // Y axis line
  const yAxisLine = createSVGElement('line', {
    x1: 0,
    y1: dimensions.padding,
    x2: 0,
    y2: dimensions.height - dimensions.padding,
    stroke: 'var(--text-color)',
    'stroke-width': 1,
    opacity: 0.5
  });
  
  yAxisGroup.appendChild(yAxisLine);
  
  // Y axis ticks and grid lines
  const tickCount = 5;
  const tickStep = maxValue * 1.1 / tickCount;
  
  for (let i = 0; i <= tickCount; i++) {
    const value = i * tickStep;
    const y = yAxis.scale(value);
    
    // Tick mark
    const tick = createSVGElement('text', {
      x: -5,
      y: y + 4, // Adjust for text alignment
      'text-anchor': 'end',
      'font-size': '12px',
      fill: 'var(--text-color)',
      opacity: 0.7
    });
    
    tick.textContent = Math.round(value);
    yAxisGroup.appendChild(tick);
    
    // Grid line
    const gridLine = createSVGElement('line', {
      x1: 0,
      y1: y,
      x2: dimensions.width - dimensions.padding * 2,
      y2: y,
      stroke: 'var(--text-color)',
      'stroke-width': 1,
      opacity: 0.1,
      'stroke-dasharray': '3,3'
    });
    
    yAxisGroup.appendChild(gridLine);
  }
  
  // Y axis label
  const yAxisLabel = createSVGElement('text', {
    transform: `translate(-30, ${dimensions.height / 2}) rotate(-90)`,
    'text-anchor': 'middle',
    'font-size': '14px',
    fill: 'var(--text-color)'
  });
  
  yAxisLabel.textContent = 'Count';
  yAxisGroup.appendChild(yAxisLabel);
  
  svg.appendChild(yAxisGroup);
  
  // Draw bars
  const barGroup = createSVGElement('g', {});
  
  const barWidth = xAxis.bandwidth() / 2 - 5; // Half width for each bar with a small gap
  
  recentData.forEach(d => {
    const x = xAxis.scale(d.date) - barWidth - 2.5; // Position for the "done" bar
    const y = yAxis.scale(d.done);
    const height = dimensions.height - dimensions.padding - y;
    
    // "Done" bar
    const doneBar = createSVGElement('rect', {
      x,
      y,
      width: barWidth,
      height: height > 0 ? height : 0,
      fill: opts.doneColor,
      rx: 2,
      ry: 2,
      cursor: 'pointer'
    });
    
    // Add animation if enabled
    if (opts.animate) {
      doneBar.style.transition = `height ${opts.animationDuration}ms ease, y ${opts.animationDuration}ms ease`;
      doneBar.setAttribute('height', 0);
      doneBar.setAttribute('y', dimensions.height - dimensions.padding);
      
      // Trigger animation
      setTimeout(() => {
        doneBar.setAttribute('height', height > 0 ? height : 0);
        doneBar.setAttribute('y', y);
      }, 10);
    }
    
    // Add tooltip events
    doneBar.addEventListener('mouseenter', () => {
      doneBar.setAttribute('opacity', 0.8);
      
      const date = d.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      tooltip.show(x + barWidth / 2, y, `${date}\nAudits Done: ${d.done}`);
    });
    
    doneBar.addEventListener('mouseleave', () => {
      doneBar.setAttribute('opacity', 1);
      tooltip.hide();
    });
    
    barGroup.appendChild(doneBar);
    
    // "Received" bar
    const receivedX = x + barWidth + 5; // Position for the "received" bar
    const receivedY = yAxis.scale(d.received);
    const receivedHeight = dimensions.height - dimensions.padding - receivedY;
    
    const receivedBar = createSVGElement('rect', {
      x: receivedX,
      y: receivedY,
      width: barWidth,
      height: receivedHeight > 0 ? receivedHeight : 0,
      fill: opts.receivedColor,
      rx: 2,
      ry: 2,
      cursor: 'pointer'
    });
    
    // Add animation if enabled
    if (opts.animate) {
      receivedBar.style.transition = `height ${opts.animationDuration}ms ease, y ${opts.animationDuration}ms ease`;
      receivedBar.setAttribute('height', 0);
      receivedBar.setAttribute('y', dimensions.height - dimensions.padding);
      
      // Trigger animation with a small delay
      setTimeout(() => {
        receivedBar.setAttribute('height', receivedHeight > 0 ? receivedHeight : 0);
        receivedBar.setAttribute('y', receivedY);
      }, 100);
    }
    
    // Add tooltip events
    receivedBar.addEventListener('mouseenter', () => {
      receivedBar.setAttribute('opacity', 0.8);
      
      const date = d.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      tooltip.show(receivedX + barWidth / 2, receivedY, `${date}\nAudits Received: ${d.received}`);
    });
    
    receivedBar.addEventListener('mouseleave', () => {
      receivedBar.setAttribute('opacity', 1);
      tooltip.hide();
    });
    
    barGroup.appendChild(receivedBar);
  });
  
  svg.appendChild(barGroup);
  
  // Add legend
  const legend = createSVGElement('g', {
    transform: `translate(${dimensions.width - dimensions.padding - 150}, ${dimensions.padding})`
  });
  
  // "Done" legend item
  const doneLegendItem = createSVGElement('g', {
    transform: 'translate(0, 0)'
  });
  
  const doneLegendColor = createSVGElement('rect', {
    x: 0,
    y: -10,
    width: 12,
    height: 12,
    fill: opts.doneColor
  });
  
  const doneLegendText = createSVGElement('text', {
    x: 20,
    y: 0,
    'font-size': '12px',
    fill: 'var(--text-color)'
  });
  doneLegendText.textContent = 'Done';
  
  doneLegendItem.appendChild(doneLegendColor);
  doneLegendItem.appendChild(doneLegendText);
  legend.appendChild(doneLegendItem);
  
  // "Received" legend item
  const receivedLegendItem = createSVGElement('g', {
    transform: 'translate(0, 20)'
  });
  
  const receivedLegendColor = createSVGElement('rect', {
    x: 0,
    y: -10,
    width: 12,
    height: 12,
    fill: opts.receivedColor
  });
  
  const receivedLegendText = createSVGElement('text', {
    x: 20,
    y: 0,
    'font-size': '12px',
    fill: 'var(--text-color)'
  });
  receivedLegendText.textContent = 'Received';
  
  receivedLegendItem.appendChild(receivedLegendColor);
  receivedLegendItem.appendChild(receivedLegendText);
  legend.appendChild(receivedLegendItem);
  
  svg.appendChild(legend);
}

export default {
  createAuditRatioChart,
  createAuditComparisonChart
}; 