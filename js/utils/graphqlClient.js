/**
 * GraphQL Client Utility
 * Handles API requests to the GraphQL endpoint with authentication
 */

// GraphQL endpoint
const GRAPHQL_ENDPOINT = 'https://learn.zone01kisumu.ke/api/graphql-engine/v1/graphql';

// localStorage key for auth token
const AUTH_TOKEN_KEY = 'auth_token';

/**
 * Execute a GraphQL query with variables
 * @param {string} query - GraphQL query string
 * @param {Object} variables - Variables for the query (optional)
 * @returns {Promise<Object>} - Response data
 * @throws {Error} - If the request fails or GraphQL returns errors
 */
export async function fetchGraphQL(query, variables = {}) {
  // Get JWT token from localStorage
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  
  if (!token) {
    throw new Error('Authentication required: No token found');
  }
  
  try {
    // Set up request with headers
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        query,
        variables
      })
    });
    
    // Check for HTTP errors
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }
    
    // Parse response
    const result = await response.json();
    
    // Check for GraphQL errors
    if (result.errors) {
      const errorMessage = result.errors.map(e => e.message).join(', ');
      throw new Error(`GraphQL error: ${errorMessage}`);
    }
    
    // Return data
    return result.data;
  } catch (error) {
    console.error('GraphQL request failed:', error);
    throw error;
  }
}

/**
 * Create a loading indicator
 * @param {HTMLElement} container - Container for the loading indicator
 * @returns {Object} Loading indicator with show/hide methods
 */
export function createLoadingIndicator(container) {
  // Create loader element
  const loader = document.createElement('div');
  loader.className = 'loading-spinner';
  loader.innerHTML = `
    <div class="spinner"></div>
    <p>Loading data...</p>
  `;
  loader.style.display = 'none';
  
  // Add to container
  container.appendChild(loader);
  
  // Return object with show/hide methods
  return {
    show: () => {
      loader.style.display = 'flex';
    },
    hide: () => {
      loader.style.display = 'none';
    },
    element: loader
  };
}

/**
 * Show error message
 * @param {HTMLElement} container - Container for the error message
 * @param {string} message - Error message to display
 */
export function showError(container, message) {
  const errorElement = document.createElement('div');
  errorElement.className = 'error-message';
  errorElement.innerHTML = `
    <div class="error-icon">⚠️</div>
    <p>${message}</p>
  `;
  
  container.appendChild(errorElement);
}

export default {
  fetchGraphQL,
  createLoadingIndicator,
  showError
}; 