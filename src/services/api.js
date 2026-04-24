import axios from "axios";

// =============================
// 🌐 BASE URL API
// =============================
const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// =============================
// ⚡ AXIOS INSTANCE
// =============================
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// =============================
// 🔐 INTERCEPTOR - AJOUT TOKEN AUTO
// =============================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// =============================
// ❌ INTERCEPTOR - GESTION ERREURS GLOBALES
// =============================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    console.error("❌ API ERROR:", {
      status,
      message: error.response?.data || error.message
    });

    // 🔥 TOKEN EXPIRED / UNAUTHORIZED
    if (status === 401) {
      localStorage.removeItem("token");

      // éviter boucle reload infinie
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;