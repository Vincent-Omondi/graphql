// Import components and services
import { 
    renderLoginComponent, 
    isAuthenticated, 
    logout 
  } from './components/auth.js';
import { renderProfileComponent } from './components/profile.js';

// Simple router
const routes = {
  '/': 'home',
  '/login': 'login'
};

// App state
const state = {
  currentRoute: window.location.pathname,
  isAuthenticated: false,
  user: null
};

// Initialize the application
function initApp() {
  // Check authentication status
  checkAuthStatus();
  
  // Set up event listeners
  setupEventListeners();
  
  // Handle initial route
  handleRoute(window.location.pathname);
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
    if (anchor && anchor.getAttribute('href').startsWith('/')) {
      e.preventDefault();
      navigateTo(anchor.getAttribute('href'));
    }
  });

  // Listen for navigation events (browser back/forward buttons)
  window.addEventListener('popstate', () => {
    handleRoute(window.location.pathname);
  });
  
  // Listen for custom events from components
  document.addEventListener('login-success', (e) => {
    state.isAuthenticated = true;
    state.user = e.detail.user;
    navigateTo('/');
  });
  
  document.addEventListener('logout', () => {
    logout();
    state.isAuthenticated = false;
    state.user = null;
    navigateTo('/login');
  });
}

// Handle routing
function handleRoute(path) {
  const route = routes[path] || 'notFound';
  
  // If authenticated and trying to access login, redirect to home
  if (route === 'login' && state.isAuthenticated) {
    navigateTo('/');
    return;
  }
  
  // Render the appropriate component based on route
  const appContainer = document.getElementById('app');
  appContainer.innerHTML = ''; // Clear current view
  
  switch(route) {
    case 'home':
      // For simplicity, redirect to login if not authenticated
      if (!state.isAuthenticated) {
        navigateTo('/login');
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
          <a href="/" class="btn">Go Home</a>
        </div>
      `;
      break;
  }
}

// Navigate to a new route
function navigateTo(path) {
  window.history.pushState({}, '', path);
  handleRoute(path);
}

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);

// Export for potential use by other modules
export { navigateTo, state };