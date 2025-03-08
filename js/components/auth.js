// Combined Authentication Service and Login Component

// =============================================
// Authentication Service
// =============================================

const AUTH_TOKEN_KEY = 'auth_token';
const API_URL = 'https://yourdomain.com/api'; // Replace with your actual API URL

/**
 * Login with username/email and password
 * @param {Object} credentials - Contains username and password
 * @returns {Promise<Object>} User data and token
 */
export async function login(credentials) {
  try {
    // Determine if username is actually an email
    const isEmail = credentials.username.includes('@');
    
    // Create basic auth token (base64 encoded username:password)
    const authValue = btoa(`${credentials.username}:${credentials.password}`);
    
    // Make POST request to signin endpoint
    const response = await fetch(`${API_URL}/auth/signin`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authValue}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Handle non-200 responses
    if (!response.ok) {
      let errorMessage = 'Authentication failed';
      
      // Try to get error details from response
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If parsing JSON fails, use status text
        errorMessage = response.statusText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }
    
    // Parse response to get JWT
    const data = await response.json();
    const token = data.token || data.jwt || data.access_token;
    
    if (!token) {
      throw new Error('No token received from server');
    }
    
    // Store the token
    storeToken(token);
    
    // Decode token to get user info (if JWT contains user info)
    const user = decodeToken(token);
    
    return {
      token,
      user
    };
    
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

/**
 * Logout - remove token from storage
 */
export function logout() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

/**
 * Check if user is authenticated
 * @returns {boolean} Authentication status
 */
export function isAuthenticated() {
  const token = getToken();
  if (!token) return false;
  
  // Check if token is expired
  const tokenData = decodeToken(token);
  if (!tokenData) return false;
  
  // If token has expiration, check if it's still valid
  if (tokenData.exp) {
    const currentTime = Math.floor(Date.now() / 1000);
    return tokenData.exp > currentTime;
  }
  
  return true;
}

/**
 * Get the current auth token
 * @returns {string|null} The JWT token or null
 */
export function getToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Store auth token in localStorage
 * @param {string} token - JWT token
 */
function storeToken(token) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

/**
 * Decode JWT token to get payload data
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token payload or null if invalid
 */
function decodeToken(token) {
  try {
    // Split the token into parts
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode the payload (middle part)
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Get auth header for API requests
 * @returns {Object} Headers object with Authorization
 */
export function getAuthHeaders() {
  const token = getToken();
  return token ? {
    'Authorization': `Bearer ${token}`
  } : {};
}

// =============================================
// Login Component
// =============================================

/**
 * Render the login component into the specified container
 * @param {HTMLElement} container - The container to render the login component into
 */
export function renderLoginComponent(container) {
  const loginHTML = `
    <div class="login-container glow-container">
      <a href="/" class="back-to-home hover-scale">
        <i class="fas fa-arrow-left"></i> Back
      </a>
      
      <div class="login-card glass-card">
        <div class="login-header">
          <h1 class="login-title gradient-text">Welcome Back</h1>
          <p class="login-subtitle">Sign in to continue</p>
        </div>
        
        <form id="login-form" class="login-form">
          <div class="form-group">
            <label for="username" class="form-label">Username or Email</label>
            <input 
              type="text" 
              id="username" 
              class="form-input" 
              placeholder="Enter your username or email" 
              required
            >
            <div id="username-error" class="error-message hidden"></div>
          </div>
          
          <div class="form-group">
            <label for="password" class="form-label">Password</label>
            <input 
              type="password" 
              id="password" 
              class="form-input" 
              placeholder="Enter your password" 
              required
            >
            <button 
              type="button"
              class="password-toggle"
              id="password-toggle"
              aria-label="Toggle password visibility"
            >
              <i class="fas fa-eye"></i>
            </button>
            <div id="password-error" class="error-message hidden"></div>
          </div>
          
          <button type="submit" id="login-button" class="login-btn hover-glow">
            <span id="login-spinner" class="loading-spinner hidden"></span>
            <span id="login-text">Sign In</span>
          </button>
          
          <div id="auth-error" class="error-message text-center hidden"></div>
        </form>
        
        <div class="login-divider">or</div>
        
        <div class="text-center">
          <p class="gradient-text">Need access? Contact your administrator</p>
        </div>
      </div>
    </div>
  `;
  
  container.innerHTML = loginHTML;
  setupLoginEvents();
}

/**
 * Set up event listeners for the login form
 */
function setupLoginEvents() {
  const loginForm = document.getElementById('login-form');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const passwordToggle = document.getElementById('password-toggle');
  const usernameError = document.getElementById('username-error');
  const passwordError = document.getElementById('password-error');
  const authError = document.getElementById('auth-error');
  const loginButton = document.getElementById('login-button');
  const loginSpinner = document.getElementById('login-spinner');
  const loginText = document.getElementById('login-text');
  
  // Password toggle functionality
  passwordToggle.addEventListener('click', () => {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    passwordToggle.innerHTML = type === 'password' 
      ? '<i class="fas fa-eye"></i>' 
      : '<i class="fas fa-eye-slash"></i>';
  });

  // Form submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Reset error messages
    usernameError.textContent = '';
    usernameError.classList.add('hidden');
    passwordError.textContent = '';
    passwordError.classList.add('hidden');
    authError.textContent = '';
    authError.classList.add('hidden');
    
    // Validate inputs
    let isValid = true;
    
    if (!usernameInput.value.trim()) {
      usernameError.textContent = 'Username or email is required';
      usernameError.classList.remove('hidden');
      isValid = false;
    }
    
    if (!passwordInput.value.trim()) {
      passwordError.textContent = 'Password is required';
      passwordError.classList.remove('hidden');
      isValid = false;
    }
    
    // If email format is entered, validate email format
    if (usernameInput.value.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(usernameInput.value.trim())) {
        usernameError.textContent = 'Please enter a valid email address';
        usernameError.classList.remove('hidden');
        isValid = false;
      }
    }
    
    if (!isValid) return;
    
    // Show loading state
    loginButton.disabled = true;
    loginSpinner.classList.remove('hidden');
    loginText.textContent = 'Signing in...';
    
    try {
      // Attempt login
      const credentials = {
        username: usernameInput.value.trim(),
        password: passwordInput.value
      };
      
      const result = await login(credentials);
      
      // Dispatch login success event with user data
      const loginSuccessEvent = new CustomEvent('login-success', {
        detail: { user: result.user }
      });
      document.dispatchEvent(loginSuccessEvent);
      
    } catch (error) {
      // Hide loading state
      loginButton.disabled = false;
      loginSpinner.classList.add('hidden');
      loginText.textContent = 'Sign In';
      
      // Display error message
      authError.textContent = error.message || 'Authentication failed. Please check your credentials and try again.';
      authError.classList.remove('hidden');
    }
  });
  
  // Input event listeners for real-time validation
  usernameInput.addEventListener('input', () => {
    if (usernameInput.value.trim()) {
      usernameError.classList.add('hidden');
    }
  });
  
  passwordInput.addEventListener('input', () => {
    if (passwordInput.value.trim()) {
      passwordError.classList.add('hidden');
    }
  });
}