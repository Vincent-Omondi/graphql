/**
 * SVG Helper Functions
 * Utility functions for creating SVG elements and graphs
 */

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Create an SVG element with attributes
 * @param {string} tag - SVG tag name
 * @param {Object} attributes - SVG attributes
 * @returns {SVGElement} - The created SVG element
 */
export function createSVGElement(tag, attributes = {}) {
  const element = document.createElementNS(SVG_NS, tag);
  
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  
  return element;
}

/**
 * Create an SVG container with responsive behavior
 * @param {number} width - Width of the SVG viewport
 * @param {number} height - Height of the SVG viewport
 * @param {number} padding - Padding around the graph
 * @returns {Object} - Object containing the SVG element and dimensions
 */
export function createSVGContainer(width, height, padding = 40) {
  try {
    const svg = createSVGElement('svg', {
      width: '100%',
      height: '100%',
      viewBox: `0 0 ${width} ${height}`,
      preserveAspectRatio: 'xMidYMid meet',
      class: 'svg-graph'
    });
    
    // Return both the SVG element and dimensions object
    const dimensions = {
      width,
      height,
      padding,
      innerWidth: width - (padding * 2),
      innerHeight: height - (padding * 2)
    };
    
    return { svg, dimensions };
  } catch (error) {
    console.error('Error creating SVG container');
    // Return a fallback empty div element and dimensions
    const fallbackElement = document.createElement('div');
    fallbackElement.className = 'svg-error';
    fallbackElement.textContent = 'Error creating SVG';
    
    return { 
      svg: fallbackElement, 
      dimensions: { width, height, padding, innerWidth: width - (padding * 2), innerHeight: height - (padding * 2) }
    };
  }
}

/**
 * Create X and Y axes for a graph
 * @param {SVGElement} svg - The SVG container
 * @param {Object} scales - Object with xScale and yScale functions
 * @param {Object} options - Axis configuration options
 * @returns {Object} - Object containing the created axes elements
 */
export function createAxes(svg, dimensions, options = {}) {
  // Check if svg is an object with svg property (from createSVGContainer)
  // or is directly an SVG element
  const svgElement = svg.svg || svg;
  
  if (!svgElement || typeof svgElement.appendChild !== 'function') {
    throw new Error('Invalid SVG element');
  }
  
  const { width, height, padding } = dimensions;
  const { 
    xLabel = '', 
    yLabel = '', 
    xTicks = 5, 
    yTicks = 5,
    xTickFormat = v => v,
    yTickFormat = v => v,
    xTickValues,
    yTickValues,
    gridLines = true
  } = options;
  
  const xAxisGroup = createSVGElement('g', {
    class: 'x-axis',
    transform: `translate(0, ${height - padding})`
  });
  
  const yAxisGroup = createSVGElement('g', {
    class: 'y-axis',
    transform: `translate(${padding}, 0)`
  });
  
  // X-axis line
  const xAxisLine = createSVGElement('line', {
    x1: padding,
    y1: 0,
    x2: width - padding,
    y2: 0,
    stroke: 'var(--tertiary-dark)',
    'stroke-width': 1
  });
  
  // Y-axis line
  const yAxisLine = createSVGElement('line', {
    x1: 0,
    y1: padding,
    x2: 0,
    y2: height - padding,
    stroke: 'var(--tertiary-dark)',
    'stroke-width': 1
  });
  
  xAxisGroup.appendChild(xAxisLine);
  yAxisGroup.appendChild(yAxisLine);
  
  svgElement.appendChild(xAxisGroup);
  svgElement.appendChild(yAxisGroup);
  
  return { xAxisGroup, yAxisGroup };
}

/**
 * Add dynamic tick marks to axes
 * @param {Object} axisGroups - Object with xAxisGroup and yAxisGroup
 * @param {Function} xScale - X-axis scale function
 * @param {Function} yScale - Y-axis scale function 
 * @param {Object} options - Configuration options
 */
export function addAxisTicks(axisGroups, scales, dimensions, options) {
  const { xAxisGroup, yAxisGroup } = axisGroups;
  const { xScale, yScale } = scales;
  const { width, height, padding } = dimensions;
  const {
    xTicks = 5,
    yTicks = 5,
    xTickFormat = v => v,
    yTickFormat = v => v,
    xTickValues,
    yTickValues,
    gridLines = true
  } = options;
  
  // Helper to generate ticks for a range
  const generateTickValues = (min, max, count) => {
    // Handle Date objects
    if (min instanceof Date && max instanceof Date) {
      const minTime = min.getTime();
      const maxTime = max.getTime();
      const step = (maxTime - minTime) / (count - 1);
      
      return Array.from({ length: count }, (_, i) => {
        return new Date(minTime + i * step);
      });
    }
    
    // Handle numeric values
    const step = (max - min) / (count - 1);
    return Array.from({ length: count }, (_, i) => min + i * step);
  };
  
  // Safely get domain values with fallbacks
  let xDomain, yDomain;
  
  try {
    // First try with domain() function
    if (typeof xScale.domain === 'function' && typeof yScale.domain === 'function') {
      xDomain = xScale.domain();
      yDomain = yScale.domain();
    } else {
      // Fallback for when domain function is unavailable
      throw new Error('domain() function not available');
    }
  } catch (e) {
    // Try to access domain property directly
    if (xScale.domain !== undefined && yScale.domain !== undefined) {
      xDomain = xScale.domain;
      yDomain = yScale.domain;
    } else {
      // Last resort fallback
      xDomain = [0, 100];
      yDomain = [0, 100];
    }
  }
  
  // Generate tick values
  const xTicksArray = xTickValues || generateTickValues(xDomain[0], xDomain[1], xTicks);
  const yTicksArray = yTickValues || generateTickValues(yDomain[0], yDomain[1], yTicks);
  
  xTicksArray.forEach(tickValue => {
    const tickX = xScale(tickValue);
    
    // Tick mark
    const tick = createSVGElement('line', {
      x1: tickX,
      y1: 0,
      x2: tickX,
      y2: 6,
      stroke: 'var(--tertiary-dark)',
      'stroke-width': 1
    });
    
    // Tick label
    const label = createSVGElement('text', {
      x: tickX,
      y: 20,
      'text-anchor': 'middle',
      'font-size': '12px',
      fill: 'var(--tertiary-dark)'
    });
    label.textContent = xTickFormat(tickValue);
    
    // Grid line
    if (gridLines) {
      const gridLine = createSVGElement('line', {
        x1: tickX,
        y1: 0,
        x2: tickX,
        y2: -(height - 2 * padding),
        stroke: 'var(--tertiary-dark)',
        'stroke-width': 0.5,
        'stroke-dasharray': '3,3',
        opacity: 0.3
      });
      xAxisGroup.appendChild(gridLine);
    }
    
    xAxisGroup.appendChild(tick);
    xAxisGroup.appendChild(label);
  });
  
  // Y-axis ticks
  yTicksArray.forEach(tickValue => {
    const tickY = yScale(tickValue);
    
    // Tick mark
    const tick = createSVGElement('line', {
      x1: -6,
      y1: tickY,
      x2: 0,
      y2: tickY,
      stroke: 'var(--tertiary-dark)',
      'stroke-width': 1
    });
    
    // Tick label
    const label = createSVGElement('text', {
      x: -10,
      y: tickY,
      'text-anchor': 'end',
      'dominant-baseline': 'middle',
      'font-size': '12px',
      fill: 'var(--tertiary-dark)'
    });
    label.textContent = yTickFormat(tickValue);
    
    // Grid line
    if (gridLines) {
      const gridLine = createSVGElement('line', {
        x1: 0,
        y1: tickY,
        x2: width - 2 * padding,
        y2: tickY,
        stroke: 'var(--tertiary-dark)',
        'stroke-width': 0.5,
        'stroke-dasharray': '3,3',
        opacity: 0.3
      });
      yAxisGroup.appendChild(gridLine);
    }
    
    yAxisGroup.appendChild(tick);
    yAxisGroup.appendChild(label);
  });
}

/**
 * Create scales for mapping data values to SVG coordinates
 * @param {Array} data - The data array
 * @param {Object} dimensions - Object with width, height, and padding
 * @param {Object} options - Scale configuration options
 * @returns {Object} - Object with xScale and yScale functions
 */
export function createScales(data, dimensions, options = {}) {
  // Extract dimension values with defaults
  const width = dimensions?.width || 400;
  const height = dimensions?.height || 300;
  const padding = dimensions?.padding || 40;
  
  // Extract options with fallbacks
  let xAccessor, yAccessor;
  
  // Handle both accessor styles (function or key string)
  if (typeof options.xAccessor === 'function') {
    xAccessor = options.xAccessor;
  } else if (options.xKey) {
    xAccessor = d => d[options.xKey];
  } else {
    xAccessor = d => d.x || d.date || 0;
  }
  
  if (typeof options.yAccessor === 'function') {
    yAccessor = options.yAccessor;
  } else if (options.yKey) {
    yAccessor = d => d[options.yKey];
  } else {
    yAccessor = d => d.y || d.value || d.ratio || 0;
  }
  
  // Get domains
  const xDomain = options.xDomain || (Array.isArray(data) ? d3ArrayExtent(data, xAccessor) : [0, 1]);
  const yDomain = options.yDomain || (Array.isArray(data) ? d3ArrayExtent(data, yAccessor) : [0, 1]);
  
  try {
    // Create x-scale
    const xScale = d3ScaleLinear(xDomain, [padding, width - padding]);
    
    // Create y-scale (inverted for SVG coordinate system)
    const yScale = d3ScaleLinear(yDomain, [height - padding, padding]);
    
    return { xScale, yScale };
  } catch (error) {
    // Create fallback scales
    const fallbackXScale = value => padding + (value / 100) * (width - 2 * padding);
    fallbackXScale.domain = () => [0, 100];
    fallbackXScale.range = () => [padding, width - padding];
    
    const fallbackYScale = value => height - padding - (value / 100) * (height - 2 * padding);
    fallbackYScale.domain = () => [0, 100];
    fallbackYScale.range = () => [height - padding, padding];
    
    return { 
      xScale: fallbackXScale, 
      yScale: fallbackYScale 
    };
  }
}

// Simple implementation of D3-like linear scale
function d3ScaleLinear(domain, range) {
  // Handle invalid domains
  if (!domain || !Array.isArray(domain) || domain.length !== 2) {
    domain = [0, 1];
  }
  
  // Handle invalid ranges
  if (!range || !Array.isArray(range) || range.length !== 2) {
    range = [0, 100];
  }
  
  // Convert date objects to timestamps
  const domainStart = domain[0] instanceof Date ? domain[0].getTime() : Number(domain[0]) || 0;
  const domainEnd = domain[1] instanceof Date ? domain[1].getTime() : Number(domain[1]) || 1;
  
  // Ensure domain values are different
  const domainDiff = (domainEnd === domainStart) ? 1 : domainEnd - domainStart;
  const rangeDiff = range[1] - range[0];
  
  // Create the scale function
  const scale = value => {
    // Handle edge cases
    if (value === undefined || value === null) {
      return range[0];
    }
    
    // Handle date objects
    const val = value instanceof Date ? value.getTime() : Number(value) || 0;
    
    // Calculate normalized value
    const normalizedValue = (val - domainStart) / domainDiff;
    
    // Ensure value is within 0-1 range to avoid drawing outside container
    const clampedValue = Math.max(0, Math.min(1, normalizedValue));
    
    return range[0] + clampedValue * rangeDiff;
  };
  
  // Add domain() and range() methods to mimic D3 scales
  scale.domain = () => domain;
  scale.range = () => range;
  
  return scale;
}

function d3ArrayExtent(array, accessor) {
  if (!array || array.length === 0) {
    return [0, 1]; // Default for empty arrays
  }
  
  const values = array.map(accessor).filter(v => v !== undefined && v !== null);
  
  if (values.length === 0) {
    return [0, 1]; // Default for empty filtered array
  }
  
  // Handle Date objects
  if (values[0] instanceof Date) {
    const timestamps = values.map(d => d.getTime());
    const min = new Date(Math.min(...timestamps));
    const max = new Date(Math.max(...timestamps));
    return [min, max];
  }
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  // Add a small buffer to the max value for better visualization
  // Ensure we don't divide by zero
  const buffer = max === 0 ? 0.1 : max * 0.05;
  return [min, max + buffer];
}

/**
 * Create an interactive tooltip for SVG elements
 * @param {SVGElement} svg - The SVG container
 * @returns {Object} - Object with show and hide methods
 */
export function createSVGTooltip(svg) {
  // Remove any existing tooltip to prevent duplicates
  const existingTooltip = svg.querySelector('.svg-tooltip');
  if (existingTooltip) {
    svg.removeChild(existingTooltip);
  }
  
  const tooltip = createSVGElement('g', {
    class: 'svg-tooltip',
    visibility: 'hidden'
  });
  
  const tooltipRect = createSVGElement('rect', {
    rx: 5,
    ry: 5,
    fill: 'var(--primary-dark, #222)',
    stroke: 'var(--secondary, #444)',
    'stroke-width': 1,
    opacity: 0.95
  });
  
  const tooltipText = createSVGElement('text', {
    x: 10,
    y: 20,
    fill: 'var(--tertiary, #fff)',
    'font-size': '12px'
  });
  
  tooltip.appendChild(tooltipRect);
  tooltip.appendChild(tooltipText);
  
  // Move tooltip to front function
  const moveToFront = () => {
    // Remove and re-append to make it the last child (appears on top)
    if (tooltip.parentNode) {
      tooltip.parentNode.removeChild(tooltip);
    }
    svg.appendChild(tooltip);
  };
  
  // Append the tooltip to the SVG
  svg.appendChild(tooltip);
  
  return {
    show: (x, y, text) => {
      // Format the text (remove HTML tags) and split into lines
      const plainText = text.replace(/<[^>]*>?/gm, '').trim();
      const lines = plainText.split('\n');
      
      // Clear existing text
      while (tooltipText.firstChild) {
        tooltipText.removeChild(tooltipText.firstChild);
      }
      
      // Add each line
      lines.forEach((line, i) => {
        const tspan = createSVGElement('tspan', {
          x: 10,
          y: 20 + (i * 16),
          'font-size': '12px'
        });
        tspan.textContent = line.trim();
        tooltipText.appendChild(tspan);
      });
      
      // Set a fixed width
      const tooltipWidth = 150;
      const tooltipHeight = lines.length * 16 + 10;
      
      tooltipRect.setAttribute('width', tooltipWidth);
      tooltipRect.setAttribute('height', tooltipHeight);
      
      // Position tooltip - ensure it stays within the SVG bounds
      const svgBounds = svg.getBoundingClientRect();
      let tooltipX = x + 10;
      let tooltipY = y - tooltipHeight - 5;
      
      // Basic bounds checking to keep tooltip visible
      if (tooltipX + tooltipWidth > svgBounds.width) {
        tooltipX = x - tooltipWidth - 10; // Position to the left instead
      }
      
      tooltip.setAttribute('transform', `translate(${tooltipX}, ${tooltipY})`);
      tooltip.setAttribute('visibility', 'visible');
      
      // Ensure tooltip is on top of other elements
      moveToFront();
    },
    hide: () => {
      tooltip.setAttribute('visibility', 'hidden');
    },
    element: tooltip
  };
} 