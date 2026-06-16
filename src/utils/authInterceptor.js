// Overrides window.fetch to globally catch 401 Unauthorized responses
// This handles session expiry by clearing tokens and redirecting to the login flow.

const originalFetch = window.fetch;

// URLs that should NEVER be intercepted (Firebase Auth, Google OAuth internals)
const EXCLUDED_ORIGINS = [
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'accounts.google.com',
  'oauth2.googleapis.com',
  'firebaseapp.com',
  'googleapis.com',
];

window.fetch = async function (...args) {
  try {
    // Check if this is an excluded URL (Firebase / Google OAuth internal)
    const url = args[0]?.toString?.() || '';
    const isExcluded = EXCLUDED_ORIGINS.some(origin => url.includes(origin));
    if (isExcluded) {
      return originalFetch.apply(this, args);
    }

    const response = await originalFetch.apply(this, args);
    
    // Check if the response is 401 Unauthorized
    if (response.status === 401) {
      console.warn('[Security] Session expired (401). Clearing tokens and redirecting...');
      
      // Clear all authentication tokens and user data
      localStorage.removeItem('bioToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('sessionId');
      sessionStorage.removeItem('zeron_profile_cache');
      
      // Redirect to face scan with a reason, only if we aren't already there
      if (window.location.pathname !== '/face-scan' && window.location.pathname !== '/') {
        window.location.href = '/face-scan?reason=session_expired';
      }
    }
    
    return response;
  } catch (error) {
    throw error;
  }
};
