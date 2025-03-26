/**
 * Audit Chart Component
 * Creates visualizations for audit data
 */
import { createSVGElement, createSVGContainer, createAxes, createScales, createSVGTooltip } from '../utils/svgHelpers.js';

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

/**
 * Creates an audit activity table
 * @param {Object} auditData - Processed audit data 
 * @param {HTMLElement} container - Container for the table
 * @param {Object} options - Table options
 */
export function createAuditActivityTable(auditData = {}, container, options = {}) {
  // Default options
  const opts = {
    maxHeight: '400px',
    doneColor: 'var(--chart-color-1)',
    receivedColor: 'var(--chart-color-4)',
    dateFormat: { year: 'numeric', month: 'short', day: 'numeric' },
    showSummary: false,
    ...options
  };
  
  // Clear container
  container.innerHTML = '';
  
  // Create table container
  const tableContainer = document.createElement('div');
  tableContainer.className = 'audit-table-container';
  container.appendChild(tableContainer);
  
  // Add title
  const title = document.createElement('h3');
  title.className = 'chart-title';
  title.textContent = 'Audit Activity History';
  tableContainer.appendChild(title);
  
  // Create table wrapper for scrollability
  const tableWrapper = document.createElement('div');
  tableWrapper.className = 'audit-table-wrapper';
  tableWrapper.style.maxHeight = opts.maxHeight;
  
  // Create table
  const table = document.createElement('table');
  table.className = 'audit-activity-table';
  
  // Create table header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  
  // Removed Path column, updated Amount header to show kB
  const headers = ['Date', 'Type', 'Project', 'Amount (kB)'];
  
  headers.forEach(headerText => {
    const th = document.createElement('th');
    th.textContent = headerText;
    headerRow.appendChild(th);
  });
  
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Create table body
  const tbody = document.createElement('tbody');
  
  // Get audit data
  const auditsDone = Array.isArray(auditData.auditsDone) ? auditData.auditsDone : [];
  const auditsReceived = Array.isArray(auditData.auditsReceived) ? auditData.auditsReceived : [];
  
  // Group received audits by project
  const receivedByProject = {};
  auditsReceived.forEach(audit => {
    const projectName = audit.object?.name || 'Unknown';
    if (!receivedByProject[projectName]) {
      receivedByProject[projectName] = {
        ...audit,
        amount: 0,
        count: 0
      };
    }
    receivedByProject[projectName].amount += audit.amount;
    receivedByProject[projectName].count += 1;
  });
  
  // Convert to array
  const aggregatedReceivedAudits = Object.values(receivedByProject).map(audit => ({
    ...audit,
    auditType: 'received'
  }));
  
  // Combine audits done and aggregated received
  const allAudits = [
    ...auditsDone.map(audit => ({ ...audit, auditType: 'done' })),
    ...aggregatedReceivedAudits
  ];
  
  // Sort by date (newest first)
  allAudits.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  if (allAudits.length === 0) {
    // Show no data message
    const noDataRow = document.createElement('tr');
    const noDataCell = document.createElement('td');
    noDataCell.setAttribute('colspan', headers.length);
    noDataCell.textContent = 'No audit activity data to display';
    noDataCell.style.textAlign = 'center';
    noDataCell.style.padding = '2rem';
    noDataRow.appendChild(noDataCell);
    tbody.appendChild(noDataRow);
  } else {
    // Create rows for each audit
    allAudits.forEach(audit => {
      const row = document.createElement('tr');
      
      // Date cell - no time
      const dateCell = document.createElement('td');
      const date = new Date(audit.createdAt);
      dateCell.textContent = date.toLocaleDateString('en-US', opts.dateFormat);
      row.appendChild(dateCell);
      
      // Type cell
      const typeCell = document.createElement('td');
      const isAuditDone = audit.auditType === 'done';
      typeCell.textContent = isAuditDone ? 'Done' : 'Received';
      typeCell.style.color = isAuditDone ? opts.doneColor : opts.receivedColor;
      typeCell.style.fontWeight = 'bold';
      row.appendChild(typeCell);
      
      // Project cell - for received audits, show count
      const projectCell = document.createElement('td');
      const projectName = audit.object?.name || 'Unknown';
      
      if (!isAuditDone && audit.count > 1) {
        projectCell.textContent = `${projectName} (${audit.count})`;
      } else {
        projectCell.textContent = projectName;
      }
      
      row.appendChild(projectCell);
      
      // Amount cell - convert to kB (divide by 1000) and format with 2 decimal places
      const amountCell = document.createElement('td');
      const amountInKB = audit.amount / 1000;
      const formattedAmount = amountInKB.toFixed(2);
      amountCell.textContent = formattedAmount;
      amountCell.style.textAlign = 'right';
      row.appendChild(amountCell);
      
      tbody.appendChild(row);
    });
  }
  
  table.appendChild(tbody);
  tableWrapper.appendChild(table);
  tableContainer.appendChild(tableWrapper);
  
  // Return info about the table
  return {
    table,
    count: allAudits.length,
    doneCount: auditsDone.length,
    receivedCount: auditsReceived.length
  };
}

export default {
  createAuditComparisonChart,
  createAuditActivityTable
}; 