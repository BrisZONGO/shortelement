import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import GestionSousModules from "./GestionSousModules";
import api from "../../services/api";

export default function AdminDashboard() {

  const token = localStorage.getItem("token");

  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [cours, setCours] = useState([]);
  const [modules, setModules] = useState([]);
  const [selectedCoursId, setSelectedCoursId] = useState(null);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCoursForm, setShowCoursForm] = useState(false);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    prix: 0,
    estPremium: false,
    anneeAcademique: "",
    image: ""
  });

  // =============================
  // 📊 LOAD DATA
  // =============================
  const loadStats = async () => {
    try {
      const res = await api.get("/api/admin/stats");
      setStats(res.data.stats);
    } catch (error) {
      console.error(error);
    }
  };

  const loadUtilisateurs = async () => {
    try {
      const res = await api.get("/api/admin/users");
      setUtilisateurs(res.data.users);
    } catch (error) {
      console.error(error);
    }
  };

  const loadCours = async () => {
    try {
      const res = await api.get("/api/cours");
      setCours(res.data.cours);
    } catch (error) {
      console.error(error);
    }
  };

  const loadModules = async (coursId) => {
    try {
      const res = await api.get(`/api/modules/cours/${coursId}`);
      setModules(res.data.modules);
    } catch (error) {
      console.error(error);
      setModules([]);
    }
  };

  // =============================
  // ACTIONS
  // =============================
  const deleteUser = async (id) => {
    if (!window.confirm("Supprimer cet utilisateur ?")) return;
    await api.delete(`/api/admin/users/${id}`);
    loadUtilisateurs();
    loadStats();
  };

  const changeRole = async (id, role) => {
    await api.put(`/api/admin/users/${id}/role`, { role });
    loadUtilisateurs();
  };

  const handleCoursSubmit = async (e) => {
    e.preventDefault();

    if (editingItem) {
      await api.put(`/api/cours/${editingItem._id}`, formData);
    } else {
      await api.post(`/api/cours`, formData);
    }

    setShowCoursForm(false);
    setEditingItem(null);
    setFormData({
      titre: "",
      description: "",
      prix: 0,
      estPremium: false,
      anneeAcademique: "",
      image: ""
    });

    loadCours();
  };

  const deleteCours = async (id) => {
    if (!window.confirm("Supprimer ce cours ?")) return;
    await api.delete(`/api/cours/${id}`);
    loadCours();
  };

  const handleModuleSubmit = async (e) => {
    e.preventDefault();

    await api.post("/api/modules", {
      ...formData,
      coursId: selectedCoursId
    });

    setShowModuleForm(false);
    setFormData({ titre: "", description: "" });
    loadModules(selectedCoursId);
  };

  // =============================
  // HOOKS (TOUJOURS EN HAUT)
  // =============================
  useEffect(() => {
    const init = async () => {
      await Promise.all([
        loadStats(),
        loadUtilisateurs(),
        loadCours()
      ]);
      setLoading(false);
    };

    init();
  }, []);

  useEffect(() => {
    if (selectedCoursId) {
      loadModules(selectedCoursId);
    }
  }, [selectedCoursId]);

  // =============================
  // PROTECTION UI (APRÈS HOOKS)
  // =============================
  if (!token) {
    return <p style={{ textAlign: "center", padding: "50px" }}>⛔ Accès refusé</p>;
  }

  if (loading) {
    return <p style={{ textAlign: "center", padding: "50px" }}>⏳ Chargement...</p>;
  }

  // =============================
  // UI
  // =============================
  return (
    <div style={{ padding: "20px" }}>

      <h1>📊 Admin Dashboard</h1>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => setActiveTab("dashboard")}>Dashboard</button>
        <button onClick={() => setActiveTab("utilisateurs")}>Users</button>
        <button onClick={() => setActiveTab("cours")}>Cours</button>
        <button onClick={() => setActiveTab("modules")}>Modules</button>
      </div>

      {/* DASHBOARD */}
      {activeTab === "dashboard" && stats && (
        <div>
          <p>Users: {stats.totalUsers}</p>
          <p>Abonnements: {stats.abonnementsActifs}</p>
          <p>Revenus: {stats.revenus}</p>
        </div>
      )}

      {/* USERS */}
      {activeTab === "utilisateurs" && (
        <div>
          {utilisateurs.map(u => (
            <div key={u._id}>
              {u.email}
              <select value={u.role} onChange={(e) => changeRole(u._id, e.target.value)}>
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
              <button onClick={() => deleteUser(u._id)}>🗑️</button>
            </div>
          ))}
        </div>
      )}

      {/* COURS */}
      {activeTab === "cours" && (
        <div>
          {cours.map(c => (
            <div key={c._id}>
              {c.titre}
              <button onClick={() => deleteCours(c._id)}>🗑️</button>
            </div>
          ))}
        </div>
      )}

      {/* MODULES */}
      {activeTab === "modules" && (
        <div>

          <select onChange={(e) => setSelectedCoursId(e.target.value)}>
            <option value="">Choisir cours</option>
            {cours.map(c => (
              <option key={c._id} value={c._id}>{c.titre}</option>
            ))}
          </select>

          {modules.map(m => (
            <div key={m._id}>
              {m.titre}
              <button onClick={() => setSelectedModuleId(m._id)}>Voir</button>
            </div>
          ))}

          {selectedModuleId && (
            <GestionSousModules moduleId={selectedModuleId} />
          )}

        </div>
      )}

    </div>
  );
}