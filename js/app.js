// Import components and services
import { 
    renderLoginComponent, 
    isAuthenticated, 
    logout 
  } from './components/auth.js';
import { renderProfileComponent } from './components/profile.js';

// Simple router - using hash-based routing
const routes = {
  '#/': 'home',
  '#/login': 'login'
};

// App state
const state = {
  currentRoute: window.location.hash || '#/',
  isAuthenticated: false,
  user: null
};

// Initialize the application
function initApp() {
  // Check authentication status
  checkAuthStatus();
  
  // Set up event listeners
  setupEventListeners();
  
  // Default to #/ if no hash is present
  if (!window.location.hash) {
    window.location.hash = '#/';
  } else {
    // Handle initial route
    handleRoute(window.location.hash);
  }
}

// Check if user is authenticated
function checkAuthStatus() {
  state.isAuthenticated = isAuthenticated();
}

// Set up event listeners for navigation and other global events
function setupEventListeners() {
  // Handle navigation without page reload
  document.addEventListener('click', (e) => {
    // Find closest anchor tag
    const anchor = e.target.closest('a');
    if (anchor && anchor.getAttribute('href').startsWith('#/')) {
      e.preventDefault();
      navigateTo(anchor.getAttribute('href'));
    }
  });

  // Listen for hash changes
  window.addEventListener('hashchange', () => {
    handleRoute(window.location.hash);
  });
  
  // Listen for custom events from components
  document.addEventListener('login-success', (e) => {
    state.isAuthenticated = true;
    state.user = e.detail.user;
    navigateTo('#/');
  });
  
  document.addEventListener('logout', () => {
    logout();
    state.isAuthenticated = false;
    state.user = null;
    navigateTo('#/login');
  });
}

// Handle routing
function handleRoute(hash) {
  const route = routes[hash] || 'notFound';
  
  // If authenticated and trying to access login, redirect to home
  if (route === 'login' && state.isAuthenticated) {
    navigateTo('#/');
    return;
  }
  
  // Render the appropriate component based on route
  const appContainer = document.getElementById('app');
  appContainer.innerHTML = ''; // Clear current view
  
  switch(route) {
    case 'home':
      // For simplicity, redirect to login if not authenticated
      if (!state.isAuthenticated) {
        navigateTo('#/login');
      } else {
        // Render the profile component when authenticated
        renderProfileComponent(appContainer, state.user);
      }
      break;
    case 'login':
      renderLoginComponent(appContainer);
      break;
    case 'notFound':
      appContainer.innerHTML = `
        <div class="container text-center mt-4">
          <h1>404 - Page Not Found</h1>
          <p>The page you're looking for doesn't exist.</p>
          <a href="#/" class="btn">Go Home</a>
        </div>
      `;
      break;
  }
}

// Navigate to a new route
function navigateTo(hash) {
  window.location.hash = hash;
}

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);

// Export for potential use by other modules
export { navigateTo, state };