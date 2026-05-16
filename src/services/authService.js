/**
 * Authentication Service
 * Handles user authentication and provides authenticated API calls
 */

class AuthService {
  constructor() {
    this.user = null;
    this.token = null;
    this.listeners = [];
    this._loadFromStorage();
  }

  _loadFromStorage() {
    const token = localStorage.getItem('jwt_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      this.token = token;
      this.user = JSON.parse(userData);
    }
  }

  /**
   * Get current user
   */
  getUser() {
    return this.user;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  /**
   * Get authorization headers
   */
  getAuthHeaders() {
    if (!this.token) {
      return {};
    }
    return {
      'Authorization': `Bearer ${this.token}`
    };
  }

  /**
   * Set user and token
   */
  setAuth(userData, token) {
    this.user = userData;
    this.token = token;
    localStorage.setItem('jwt_token', token);
    localStorage.setItem('user_data', JSON.stringify(userData));
    this._notifyListeners();
  }

  /**
   * Clear authentication
   */
  clearAuth() {
    this.user = null;
    this.token = null;
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_data');
    this._notifyListeners();
  }

  /**
   * Subscribe to auth changes
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  _notifyListeners() {
    this.listeners.forEach(callback => callback(this.user));
  }

  /**
   * Make authenticated API call
   */
  async apiCall(url, options = {}) {
    const headers = {
      ...options.headers,
      ...this.getAuthHeaders()
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    // Handle 401 Unauthorized
    if (response.status === 401) {
      this.clearAuth();
      throw new Error('Authentication required');
    }

    return response;
  }

  /**
   * Authenticated GET request
   */
  async get(url) {
    const response = await this.apiCall(url);
    if (!response.ok) {
      throw new Error(`GET ${url} failed: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Authenticated POST request
   */
  async post(url, data) {
    const response = await this.apiCall(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error(`POST ${url} failed: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Authenticated PUT request
   */
  async put(url, data) {
    const response = await this.apiCall(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error(`PUT ${url} failed: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Authenticated DELETE request
   */
  async delete(url) {
    const response = await this.apiCall(url, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error(`DELETE ${url} failed: ${response.status}`);
    }
    return response.json();
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService;
