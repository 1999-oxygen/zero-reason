/**
 * Application Configuration
 * Centralized config for API URLs and environment settings
 */

// API Base URL - uses environment variable or defaults to Cloud Run
export const API_BASE_URL = import.meta.env.VITE_API_URL || 
  'https://omnivision-backend-608881410748.us-central1.run.app';

// Google OAuth Client ID
export const GOOGLE_CLIENT_ID = "48750229292-ljj00ef6sv9lvjh5c2rmcromvgpt9ro7.apps.googleusercontent.com";

// Environment
export const IS_PRODUCTION = import.meta.env.PROD;
export const IS_DEVELOPMENT = import.meta.env.DEV;

console.log('🔧 Config loaded:', {
  API_BASE_URL,
  IS_PRODUCTION,
  IS_DEVELOPMENT
});
