/**
 * Projects Chart Component
 * Creates interactive SVG charts showing project statistics
 */
import { createSVGElement, createSVGContainer, createSVGTooltip } from '../utils/svgHelpers.js';
import { formatNumber } from '../utils/domHelpers.js';

export function createDonutChart(data, container, options = {}) {
  // Clear container
  container.innerHTML = '';
  
  // Default options
  const opts = {
    width: 400,
    height: 200,
    innerRadius: 50,
    outerRadius: 100,
    animated: true,
    colors: ['var(--secondary)', '#ff5a5a'],
    labels: ['Passed', 'Failed'],
    legendDistance: 5, 
    ...options
  };
  
  // Dimensions
  const dimensions = {
    width: opts.width,
    height: opts.height
  };
  
  // Center point
  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2 - 10; // Move center point up slightly
  
  // Create SVG container
  const { svg, dimensions: svgDimensions } = createSVGContainer(dimensions.width, dimensions.height);
  container.appendChild(svg);
  
  // Background circle
  const bgCircle = createSVGElement('circle', {
    cx: centerX,
    cy: centerY,
    r: opts.outerRadius,
    fill: 'var(--primary-dark)',
    opacity: 0.3
  });
  
  svg.appendChild(bgCircle);
  
  // Calculate angles for donut segments
  const total = data.passed + data.failed;
  const passedPercentage = total > 0 ? (data.passed / total) * 100 : 0;
  const failedPercentage = total > 0 ? (data.failed / total) * 100 : 0;
  
  const passedAngle = (passedPercentage / 100) * Math.PI * 2;
  const failedAngle = (failedPercentage / 100) * Math.PI * 2;
  
  // Create donut segments
  const segments = [
    { label: opts.labels[0], value: data.passed, percentage: passedPercentage, angle: passedAngle, color: opts.colors[0] },
    { label: opts.labels[1], value: data.failed, percentage: failedPercentage, angle: failedAngle, color: opts.colors[1] }
  ];
  
  let startAngle = 0;
  
  // Create tooltip
  const tooltip = createSVGTooltip(svg);
  
  // Draw segments
  segments.forEach((segment, i) => {
    if (segment.value === 0) return; // Skip empty segments
    
    const endAngle = startAngle + segment.angle;
    
    // Special handling for 100% case
    if (segment.percentage >= 99.9 && segment.label === opts.labels[0]) {
      // Draw a complete donut with two concentric circles
      const donutGroup = createSVGElement('g', {
        class: 'donut-complete',
        'fill-rule': 'evenodd'
      });
      
      // Outer circle
      const outerCircle = createSVGElement('circle', {
        cx: centerX,
        cy: centerY,
        r: opts.outerRadius,
        fill: segment.color,
        'fill-opacity': 0.8,
        stroke: 'var(--primary)',
        'stroke-width': 1
      });
      
      // Inner circle (creates the hole)
      const innerCircle = createSVGElement('circle', {
        cx: centerX,
        cy: centerY,
        r: opts.innerRadius,
        fill: 'var(--primary)'
      });
      
      donutGroup.appendChild(outerCircle);
      donutGroup.appendChild(innerCircle);
      
      // Add animation
      if (opts.animated) {
        donutGroup.style.transform = 'scale(0.8)';
        donutGroup.style.transformOrigin = `${centerX}px ${centerY}px`;
        donutGroup.style.opacity = 0;
        donutGroup.style.transition = 'transform 0.5s ease-out, opacity 0.5s ease-out';
        
        setTimeout(() => {
          donutGroup.style.transform = 'scale(1)';
          donutGroup.style.opacity = 1;
        }, 10);
      }
      
      // Add hover effects
      donutGroup.addEventListener('mouseover', () => {
        outerCircle.setAttribute('fill-opacity', 1);
        donutGroup.style.transform = 'scale(1.05)';
        tooltip.show(centerX + opts.outerRadius/2, centerY, 
          `${segment.label}: ${segment.value} (${segment.percentage.toFixed(1)}%)`);
      });
      
      donutGroup.addEventListener('mouseout', () => {
        outerCircle.setAttribute('fill-opacity', 0.8);
        donutGroup.style.transform = 'scale(1)';
        tooltip.hide();
      });
      
      svg.appendChild(donutGroup);
      return;
    }
    
    // Calculate path coordinates
    const x1 = centerX + opts.innerRadius * Math.cos(startAngle - Math.PI / 2);
    const y1 = centerY + opts.innerRadius * Math.sin(startAngle - Math.PI / 2);
    const x2 = centerX + opts.outerRadius * Math.cos(startAngle - Math.PI / 2);
    const y2 = centerY + opts.outerRadius * Math.sin(startAngle - Math.PI / 2);
    const x3 = centerX + opts.outerRadius * Math.cos(endAngle - Math.PI / 2);
    const y3 = centerY + opts.outerRadius * Math.sin(endAngle - Math.PI / 2);
    const x4 = centerX + opts.innerRadius * Math.cos(endAngle - Math.PI / 2);
    const y4 = centerY + opts.innerRadius * Math.sin(endAngle - Math.PI / 2);
    
    // Determine if the arc should be drawn with the large-arc-flag
    const largeArcFlag = segment.angle > Math.PI ? 1 : 0;
    
    // Create path for the segment
    const path = createSVGElement('path', {
      d: `
        M ${x1} ${y1}
        L ${x2} ${y2}
        A ${opts.outerRadius} ${opts.outerRadius} 0 ${largeArcFlag} 1 ${x3} ${y3}
        L ${x4} ${y4}
        A ${opts.innerRadius} ${opts.innerRadius} 0 ${largeArcFlag} 0 ${x1} ${y1}
      `,
      fill: segment.color,
      'fill-opacity': 0.8,
      stroke: 'var(--primary)',
      'stroke-width': 1,
      'class': 'donut-segment'
    });
    
    // Add animation if enabled
    if (opts.animated) {
      path.style.transform = 'scale(0.8)';
      path.style.transformOrigin = `${centerX}px ${centerY}px`;
      path.style.opacity = 0;
      path.style.transition = `transform 0.5s ease-out ${i * 0.2}s, opacity 0.5s ease-out ${i * 0.2}s`;
      
      setTimeout(() => {
        path.style.transform = 'scale(1)';
        path.style.opacity = 1;
      }, 10);
    }
    
    // Add hover effects and tooltip
    path.addEventListener('mouseover', () => {
      path.setAttribute('fill-opacity', 1);
      path.style.transform = 'scale(1.05)';
      path.style.transformOrigin = `${centerX}px ${centerY}px`;
      
      // Show tooltip
      const midAngle = startAngle + segment.angle / 2;
      const tooltipX = centerX + (opts.outerRadius * 0.7) * Math.cos(midAngle - Math.PI / 2);
      const tooltipY = centerY + (opts.outerRadius * 0.7) * Math.sin(midAngle - Math.PI / 2);
      
      tooltip.show(tooltipX, tooltipY, `${segment.label}: ${segment.value} (${segment.percentage.toFixed(1)}%)`);
    });
    
    path.addEventListener('mouseout', () => {
      path.setAttribute('fill-opacity', 0.8);
      path.style.transform = 'scale(1)';
      tooltip.hide();
    });
    
    svg.appendChild(path);
    
    // Update start angle for next segment
    startAngle = endAngle;
  });
  
  // Create center circle for donut hole
  const centerCircle = createSVGElement('circle', {
    cx: centerX,
    cy: centerY,
    r: opts.innerRadius - 1,
    fill: 'var(--primary)',
    stroke: 'var(--primary-dark)',
    'stroke-width': 1
  });
  
  svg.appendChild(centerCircle);
  
  // Add center text with total
  const centerText = createSVGElement('text', {
    x: centerX,
    y: centerY - 15,
    'text-anchor': 'middle',
    'font-size': '16px',
    fill: 'var(--tertiary)',
    class: 'center-text'
  });
  centerText.textContent = 'Total Projects';
  
  const centerValue = createSVGElement('text', {
    x: centerX,
    y: centerY + 15,
    'text-anchor': 'middle',
    'font-size': '24px',
    'font-weight': 'bold',
    fill: 'var(--tertiary)',
    class: 'center-value'
  });
  centerValue.textContent = total;
  
  svg.appendChild(centerText);
  svg.appendChild(centerValue);
  
  // Add legend
  const legendGroup = createSVGElement('g', {
    class: 'legend',
    transform: `translate(${dimensions.width / 2}, ${dimensions.height - opts.legendDistance})`
  });
  
  // Calculate total width of legend items to center them
  const itemWidth = 160; // Approximate width of each legend item
  const totalLegendWidth = segments.length * itemWidth;
  const startX = -totalLegendWidth / 2; // Start position to center the legend
  
  segments.forEach((segment, i) => {
    const legendItem = createSVGElement('g', {
      transform: `translate(${startX + (i * itemWidth)}, 0)`
    });
    
    // Color box
    const colorBox = createSVGElement('rect', {
      x: 0,
      y: 0,
      width: 15,
      height: 15,
      fill: segment.color,
      rx: 2,
      ry: 2
    });
    
    // Label
    const label = createSVGElement('text', {
      x: 25,
      y: 12,
      'font-size': '14px',
      fill: 'var(--tertiary)'
    });
    label.textContent = `${segment.label}: ${segment.value} (${segment.percentage.toFixed(1)}%)`;
    
    legendItem.appendChild(colorBox);
    legendItem.appendChild(label);
    legendGroup.appendChild(legendItem);
  });
  
  svg.appendChild(legendGroup);
  
  // Add title
  const title = createSVGElement('text', {
    x: dimensions.width / 2,
    y: -15,
    'text-anchor': 'middle',
    'font-size': '18px',
    fill: 'var(--tertiary)',
    class: 'chart-title'
  });
  title.textContent = 'Project Success Rate';
  
  svg.appendChild(title);
  
  // Add a transform to push the entire chart down
  svg.setAttribute('transform', 'translate(0, 10)');
  
  return {
    svg,
    tooltip
  };
}

export function createSkillsRadarChart(skills, container, options = {}) {
  // Clear container
  container.innerHTML = '';
  
  // Ensure we have at least 3 skills
  if (!skills || skills.length < 3) {
    const placeholder = document.createElement('div');
    placeholder.className = 'placeholder-message';
    placeholder.textContent = 'Not enough skill data to generate radar chart';
    container.appendChild(placeholder);
    return null;
  }
  
  // Limit to top 6 skills for better visualization
  const displaySkills = skills.slice(0, 6);
  
  // Default options
  const opts = {
    width: 450,
    height: 300,
    radius: 105,
    color: 'var(--secondary)',
    animated: true,
    levels: 5,
    ...options
  };
  
  // Dimensions
  const dimensions = {
    width: opts.width,
    height: opts.height
  };
  
  // Center point
  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;
  
  // Create SVG container
  const { svg, dimensions: svgDimensions } = createSVGContainer(dimensions.width, dimensions.height);
  
  // Add a transform to push the entire chart down
  svg.setAttribute('transform', 'translate(0, 20)');
  
  container.appendChild(svg);
  
  // Calculate angles for each axis
  const angleStep = (Math.PI * 2) / displaySkills.length;
  
  // Draw axis lines and labels
  const axisGroup = createSVGElement('g', {
    class: 'axis-group'
  });
  
  displaySkills.forEach((skill, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const x = centerX + opts.radius * Math.cos(angle);
    const y = centerY + opts.radius * Math.sin(angle);
    
    // Axis line
    const axis = createSVGElement('line', {
      x1: centerX,
      y1: centerY,
      x2: x,
      y2: y,
      stroke: 'var(--tertiary-dark)',
      'stroke-width': 1,
      'stroke-dasharray': '5,5',
      opacity: 0.5
    });
    
    // Axis label
    const labelDistance = opts.radius + 15;
    const labelX = centerX + labelDistance * Math.cos(angle);
    const labelY = centerY + labelDistance * Math.sin(angle);
    
    const label = createSVGElement('text', {
      x: labelX,
      y: labelY,
      'text-anchor': Math.abs(angle) < 0.1 || Math.abs(angle - Math.PI) < 0.1 ? 'middle' : angle > 0 && angle < Math.PI ? 'start' : 'end',
      'dominant-baseline': Math.abs(angle + Math.PI / 2) < 0.1 || Math.abs(angle - Math.PI / 2) < 0.1 ? 'middle' : angle > -Math.PI / 2 && angle < Math.PI / 2 ? 'end' : 'start',
      'font-size': '14px',
      fill: 'var(--tertiary)'
    });
    
    // Format skill name for display
    let displayName = skill.skill || skill.name || skill.type || 'Unknown Skill';
    if (displayName.length > 15) {
      displayName = displayName.substring(0, 12) + '...';
    }
    label.textContent = displayName;
    
    axisGroup.appendChild(axis);
    axisGroup.appendChild(label);
  });
  
  svg.appendChild(axisGroup);
  
  // Draw level circles
  const levelGroup = createSVGElement('g', {
    class: 'level-group'
  });
  
  for (let level = 1; level <= opts.levels; level++) {
    const levelRadius = (opts.radius * level) / opts.levels;
    const levelCircle = createSVGElement('circle', {
      cx: centerX,
      cy: centerY,
      r: levelRadius,
      fill: 'none',
      stroke: 'var(--tertiary-dark)',
      'stroke-width': 1,
      opacity: 0.3
    });
    
    levelGroup.appendChild(levelCircle);
    
    // Add percentage labels to the rightmost point
    if (level === opts.levels || level % Math.ceil(opts.levels / 2) === 0) {
      const percentLabel = createSVGElement('text', {
        x: centerX + levelRadius + 5,
        y: centerY,
        'font-size': '12px',
        fill: 'var(--tertiary)',
        opacity: 0.9
      });
      percentLabel.textContent = `${Math.round((level / opts.levels) * 100)}%`;
      levelGroup.appendChild(percentLabel);
    }
  }
  
  svg.appendChild(levelGroup);
  
  // Create tooltip
  const tooltip = createSVGTooltip(svg);
  
  // Calculate skill points for the radar
  const skillPoints = displaySkills.map((skill, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const value = skill.percentage / 100;
    const distance = value * opts.radius;
    
    return {
      x: centerX + distance * Math.cos(angle),
      y: centerY + distance * Math.sin(angle),
      skill
    };
  });
  
  // Create radar path
  const radarPath = createSVGElement('path', {
    fill: opts.color,
    'fill-opacity': 0.2,
    stroke: opts.color,
    'stroke-width': 2,
    'stroke-linejoin': 'round',
    class: 'radar-path'
  });
  
  // Generate path data
  const pathData = skillPoints.map((point, i) => 
    `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ') + ' Z';
  
  radarPath.setAttribute('d', pathData);
  
  // Add animation if enabled
  if (opts.animated) {
    radarPath.style.transform = 'scale(0)';
    radarPath.style.transformOrigin = `${centerX}px ${centerY}px`;
    radarPath.style.transition = 'transform 1s ease-out';
    
    setTimeout(() => {
      radarPath.style.transform = 'scale(1)';
    }, 10);
  }
  
  svg.appendChild(radarPath);
  
  // Add data points
  const pointsGroup = createSVGElement('g', {
    class: 'data-points'
  });
  
  skillPoints.forEach(point => {
    const dataPoint = createSVGElement('circle', {
      cx: point.x,
      cy: point.y,
      r: 6,
      fill: 'var(--primary)',
      stroke: opts.color,
      'stroke-width': 2,
      'fill-opacity': 0.7,
      class: 'data-point'
    });
    
    // Add hover effects and tooltip
    dataPoint.addEventListener('mouseover', () => {
      dataPoint.setAttribute('r', 8);
      dataPoint.setAttribute('fill-opacity', 1);
      
      tooltip.show(point.x, point.y, `${point.skill.skill || point.skill.name}: ${formatNumber(point.skill.amount)} XP (${point.skill.percentage.toFixed(1)}%)`);
    });
    
    dataPoint.addEventListener('mouseout', () => {
      dataPoint.setAttribute('r', 6);
      dataPoint.setAttribute('fill-opacity', 0.7);
      tooltip.hide();
    });
    
    pointsGroup.appendChild(dataPoint);
  });
  
  svg.appendChild(pointsGroup);
  
  // Add title
  const title = createSVGElement('text', {
    x: dimensions.width / 2,
    y: 10,
    'text-anchor': 'middle',
    'font-size': '18px',
    fill: 'var(--tertiary)',
    class: 'chart-title'
  });
  title.textContent = 'Skills Distribution';
  
  svg.appendChild(title);
  
  return {
    svg,
    tooltip
  };
} 