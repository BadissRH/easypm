/**
 * API utility functions for making authenticated requests to the backend
 */

/**
 * Get the authentication token from local storage
 * @returns The authentication token or null if not found
 */
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const userData = localStorage.getItem('user');
    if (!userData) return null;
    
    const user = JSON.parse(userData);
    return user.token || null;
  } catch (error) {
    console.error('Error retrieving auth token:', error);
    return null;
  }
};

/**
 * Make an authenticated API request
 * @param url - The API endpoint URL
 * @param options - Fetch options
 * @returns Promise with the fetch response
 */
export const apiRequest = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config: RequestInit = {
    ...options,
    headers,
  };
  
  return fetch(url, config);
};

/**
 * GET request helper
 * @param url - The API endpoint URL
 * @returns Promise with the fetch response
 */
export const apiGet = (url: string): Promise<Response> => {
  return apiRequest(url, { method: 'GET' });
};

/**
 * POST request helper
 * @param url - The API endpoint URL
 * @param data - The data to send
 * @returns Promise with the fetch response
 */
export const apiPost = (url: string, data: any): Promise<Response> => {
  return apiRequest(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * PUT request helper
 * @param url - The API endpoint URL
 * @param data - The data to send
 * @returns Promise with the fetch response
 */
export const apiPut = (url: string, data: any): Promise<Response> => {
  return apiRequest(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * DELETE request helper
 * @param url - The API endpoint URL
 * @returns Promise with the fetch response
 */
export const apiDelete = (url: string): Promise<Response> => {
  return apiRequest(url, { method: 'DELETE' });
};

/**
 * POST request helper for form data (file uploads)
 * @param url - The API endpoint URL
 * @param formData - The FormData object
 * @returns Promise with the fetch response
 */
export const apiPostFormData = (url: string, formData: FormData): Promise<Response> => {
  const token = getAuthToken();
  
  const headers: HeadersInit = {};
  
  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });
};