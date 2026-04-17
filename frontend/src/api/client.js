import axios from 'axios';
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const client = axios.create({ baseURL: BASE_URL });
client.interceptors.request.use(cfg => {
  const token = localStorage.getItem('access_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});
let isRefreshing = false, failQueue = [];
const processQueue = (error, token = null) => {
  failQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
  failQueue = [];
};
client.interceptors.response.use(res => res, async err => {
  const orig = err.config;
  if (err.response?.status === 401 && !orig._retry) {
    if (isRefreshing) return new Promise((res,rej) => failQueue.push({resolve:res,reject:rej})).then(t => { orig.headers.Authorization=`Bearer ${t}`; return client(orig); });
    orig._retry = true; isRefreshing = true;
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) { localStorage.clear(); window.location.href='/login'; return Promise.reject(err); }
    try {
      const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh });
      localStorage.setItem('access_token', data.access);
      processQueue(null, data.access);
      orig.headers.Authorization = `Bearer ${data.access}`;
      return client(orig);
    } catch(e) { processQueue(e,null); localStorage.clear(); window.location.href='/login'; return Promise.reject(e); }
    finally { isRefreshing = false; }
  }
  return Promise.reject(err);
});
export default client;
