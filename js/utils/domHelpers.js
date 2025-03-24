/**
 * DOM Helper Functions
 * Utility functions for DOM manipulation
 */

/**
 * Create an HTML element with attributes and children
 * @param {string} tag - HTML tag name
 * @param {Object} attributes - HTML attributes
 * @param {Array} children - Child nodes or text content
 * @returns {HTMLElement} - The created element
 */
export function createElement(tag, attributes = {}, children = []) {
  const element = document.createElement(tag);
  
  // Set attributes
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'textContent') {
      element.textContent = value;
    } else if (key === 'innerHTML') {
      element.innerHTML = value;
    } else if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(key.substring(2).toLowerCase(), value);
    } else {
      element.setAttribute(key, value);
    }
  });
  
  // Append children
  if (Array.isArray(children)) {
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        element.appendChild(child);
      }
    });
  } else if (typeof children === 'string') {
    element.textContent = children;
  } else if (children instanceof Node) {
    element.appendChild(children);
  }
  
  return element;
}

/**
 * Format a date string to a readable format
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date
 */
export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format a number with commas and fixed decimal places
 * @param {number} number - The number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted number
 */
export function formatNumber(number, decimals = 0) {
  return number.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Throttle function to limit the rate of function calls
 * @param {Function} func - The function to throttle
 * @param {number} limit - The time limit in milliseconds
 * @returns {Function} - Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Add a tooltip to an element
 * @param {HTMLElement} element - Element to add tooltip to
 * @param {string} text - Tooltip text
 */
export function addTooltip(element, text) {
  const tooltip = createElement('div', {
    className: 'tooltip hidden',
    textContent: text
  });
  
  document.body.appendChild(tooltip);
  
  element.addEventListener('mouseover', (e) => {
    tooltip.textContent = text;
    tooltip.classList.remove('hidden');
    
    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.left + (rect.width / 2)}px`;
    tooltip.style.top = `${rect.top - 10}px`;
  });
  
  element.addEventListener('mousemove', throttle((e) => {
    tooltip.style.left = `${e.pageX + 15}px`;
    tooltip.style.top = `${e.pageY - 30}px`;
  }, 50));
  
  element.addEventListener('mouseout', () => {
    tooltip.classList.add('hidden');
  });
}

/**
 * Create a tabbed interface
 * @param {HTMLElement} container - Container for tabs
 * @param {Array} tabData - Array of {label, content} objects
 */
export function createTabs(container, tabData) {
  const tabsNav = createElement('div', { className: 'tabs-nav' });
  const tabsContent = createElement('div', { className: 'tabs-content' });
  
  tabData.forEach((tab, index) => {
    const tabButton = createElement('button', {
      className: `tab-button ${index === 0 ? 'active' : ''}`,
      textContent: tab.label,
      onclick: () => {
        // Remove active class from all tabs
        tabsNav.querySelectorAll('.tab-button').forEach(btn => {
          btn.classList.remove('active');
        });
        tabsContent.querySelectorAll('.tab-pane').forEach(pane => {
          pane.classList.remove('active');
        });
        
        // Add active class to current tab
        tabButton.classList.add('active');
        tabPane.classList.add('active');
      }
    });
    
    const tabPane = createElement('div', {
      className: `tab-pane ${index === 0 ? 'active' : ''}`
    }, [tab.content]);
    
    tabsNav.appendChild(tabButton);
    tabsContent.appendChild(tabPane);
  });
  
  container.appendChild(tabsNav);
  container.appendChild(tabsContent);
} 