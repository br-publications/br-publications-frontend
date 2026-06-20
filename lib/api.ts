const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-dev.brpublications.com';

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null; // Handle 404 gracefully
    }
    throw new Error(`Failed to fetch API: ${response.statusText}`);
  }

  const json = await response.json();
  return json.data !== undefined ? json.data : json;
}
