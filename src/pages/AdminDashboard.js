import React, { useEffect, useState } from "react";
import API from "../services/api";

export default function AdminDashboard() {

  const token = localStorage.getItem("token");

  // 🔒 Protection
  if (!token) {
    return <p>⛔ Accès refusé</p>;
  }

  const [stats, setStats] = useState(null);

  const loadStats = async () => {
    try {
      const res = await API.get("/api/admin/stats");
      setStats(res.data);
    } catch (error) {
      console.error("Erreur stats:", error);
    }
  };

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
          <div className="card">
            <p>👥 Utilisateurs : {stats.totalUsers}</p>
          </div>

          <div className="card">
            <p>💎 Premium : {stats.premiumUsers}</p>
          </div>

          <div className="card">
            <p>💰 Revenus : {stats.revenus} FCFA</p>
          </div>
        </>
      )}
    </div>
  );
}