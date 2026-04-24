import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// =============================
// 🔐 INTERCEPTOR TOKEN AUTO
// =============================
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// =============================
// ❌ GESTION ERREURS GLOBALES
// =============================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("❌ API ERROR:", error.response?.data || error.message);

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);

export default api;