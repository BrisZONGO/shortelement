// src/services/api.js
import axios from "axios";

// =============================
// 🌐 BASE URL API
// =============================
const API_URL =
  process.env.REACT_APP_API_URL || "https://shortelement.onrender.com/api";

// =============================
// ⚡ AXIOS INSTANCE AVEC TIMEOUT
// =============================
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 secondes max
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

    // Log des requêtes en développement
    if (process.env.NODE_ENV === "development") {
      console.log(`🚀 API Request: ${config.method.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error.message);
    return Promise.reject(error);
  }
);

// =============================
// 📦 CACHE POUR LES RÉPONSES GET
// =============================
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Intercepteur pour la mise en cache
api.interceptors.request.use(
  (config) => {
    // Vérifier si la requête GET peut être servie depuis le cache
    if (config.method === 'get' && config.cache !== false) {
      const cacheKey = `${config.url}${JSON.stringify(config.params || {})}`;
      const cached = cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        // Annuler la requête et retourner les données du cache
        const cancelToken = axios.CancelToken;
        config.cancelToken = new cancelToken((cancel) => {
          cancel("Serving from cache");
        });
        config.__cachedResponse = cached.data;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour stocker les réponses en cache
api.interceptors.response.use(
  (response) => {
    // Mettre en cache les requêtes GET
    if (response.config.method === 'get' && response.config.cache !== false) {
      const cacheKey = `${response.config.url}${JSON.stringify(response.config.params || {})}`;
      cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
    }
    return response;
  },
  (error) => {
    // Vérifier si la réponse vient du cache
    if (error.config && error.config.__cachedResponse) {
      console.log("📦 Réponse servie depuis le cache");
      return Promise.resolve({ data: error.config.__cachedResponse });
    }
    
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    console.error("❌ API ERROR:", {
      status,
      message,
      url: error.config?.url
    });

    // 🔥 TOKEN EXPIRED / UNAUTHORIZED
    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userRole");

      // éviter boucle reload infinie
      if (!window.location.pathname.includes("/login") && !window.location.pathname.includes("/inscription")) {
        window.location.href = "/login";
      }
    }

    // ⏱️ TIMEOUT ERROR
    if (error.code === 'ECONNABORTED' || message.includes('timeout')) {
      console.warn("⏱️ Requête timeout - Vérifiez votre connexion");
    }

    return Promise.reject(error);
  }
);

// =============================
// 🗑️ FONCTION POUR VIDER LE CACHE
// =============================
export const clearCache = () => {
  cache.clear();
  console.log("🗑️ Cache vidé");
};

// =============================
// 🔄 FONCTION POUR FORCER LE RAFRAÎCHISSEMENT
// =============================
export const refreshCache = (url) => {
  for (const [key, value] of cache.entries()) {
    if (key.startsWith(url)) {
      cache.delete(key);
    }
  }
  console.log(`🔄 Cache rafraîchi pour: ${url}`);
};

// =============================
// 📊 FONCTION POUR VOIR LA TAILLE DU CACHE
// =============================
export const getCacheStats = () => {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  };
};

export default api;