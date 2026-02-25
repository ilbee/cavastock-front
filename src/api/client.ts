import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/ld+json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const shopId = localStorage.getItem('selectedShopId');
  const skipShopHeader = config.url?.includes('/api/login') || config.url?.includes('/api/shops');
  if (shopId && !skipShopHeader) {
    config.headers['X-Shop-Id'] = shopId;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes('/api/login')
    ) {
      localStorage.removeItem('token');
      localStorage.removeItem('selectedShopId');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default apiClient;
