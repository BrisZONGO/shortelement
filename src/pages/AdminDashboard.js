import React, { useEffect, useState } from "react";
import API from "../services/api";
import { motion } from "framer-motion";

export default function AdminDashboard() {

  const token = localStorage.getItem("token");

  // 🔒 Protection accès
  if (!token) {
    return <p>⛔ Accès refusé</p>;
  }

  const [stats, setStats] = useState(null);

  // =============================
  // 📊 LOAD STATS
  // =============================
  const loadStats = async () => {
    try {
      const res = await API.get("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStats(res.data.stats || res.data);

    } catch (error) {
      console.error("Erreur stats:", error);
    }
  };

  // =============================
  // 🔄 INIT
  // =============================
  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="container">
      <h2>📊 Dashboard Admin</h2>

      {!stats ? (
        <p>Chargement...</p>
      ) : (
        <>
          {/* USERS */}
          <div className="card">
            <p>👥 Utilisateurs : {stats.totalUsers}</p>
          </div>

          {/* PREMIUM */}
          <div className="card">
            <p>💎 Premium : {stats.premiumUsers}</p>
          </div>

          {/* 💰 REVENUS AVEC ANIMATION */}
          <div className="card">
            <p>💰 Revenus :</p>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: [0.9, 1], opacity: 1 }}
              transition={{ duration: 0.5 }}
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#28a745"
              }}
            >
              💰 {stats.revenus} FCFA
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}