import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import GestionSousModules from "./GestionSousModules";
import api, { refreshCache, clearCache } from "../../services/api";

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

  const [moduleFormData, setModuleFormData] = useState({
    titre: "",
    description: ""
  });

  // =============================
  // 📊 LOAD DATA
  // =============================
  const loadStats = async () => {
    try {
      const res = await api.get("/api/admin/stats");
      setStats(res.data.stats);
    } catch (error) {
      console.error("Erreur chargement stats:", error);
    }
  };

  const loadUtilisateurs = async () => {
    try {
      const res = await api.get("/api/admin/users");
      setUtilisateurs(res.data.users);
    } catch (error) {
      console.error("Erreur chargement utilisateurs:", error);
    }
  };

  const loadCours = async () => {
    try {
      const res = await api.get("/api/cours");
      setCours(res.data.cours || []);
    } catch (error) {
      console.error("Erreur chargement cours:", error);
    }
  };

  const loadModules = async (coursId) => {
    if (!coursId) return;
    try {
      const res = await api.get(`/api/modules/cours/${coursId}`);
      setModules(res.data.modules || []);
    } catch (error) {
      console.error("Erreur chargement modules:", error);
      setModules([]);
    }
  };

  // =============================
  // ACTIONS AVEC RAFRAÎCHISSEMENT CACHE
  // =============================
  const deleteUser = async (id) => {
    if (!window.confirm("Supprimer cet utilisateur ?")) return;
    try {
      await api.delete(`/api/admin/users/${id}`);
      refreshCache('/api/admin/users');
      await loadUtilisateurs();
      await loadStats();
    } catch (error) {
      console.error("Erreur suppression:", error);
    }
  };

  const changeRole = async (id, role) => {
    try {
      await api.put(`/api/admin/users/${id}/role`, { role });
      refreshCache('/api/admin/users');
      await loadUtilisateurs();
    } catch (error) {
      console.error("Erreur changement rôle:", error);
    }
  };

  const handleCoursSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/api/cours/${editingItem._id}`, formData);
      } else {
        await api.post(`/api/cours`, formData);
      }
      // Rafraîchir le cache des cours
      refreshCache('/api/cours');
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
      await loadCours();
    } catch (error) {
      console.error("Erreur sauvegarde cours:", error);
    }
  };

  const deleteCours = async (id) => {
    if (!window.confirm("Supprimer ce cours ?")) return;
    try {
      await api.delete(`/api/cours/${id}`);
      refreshCache('/api/cours');
      await loadCours();
    } catch (error) {
      console.error("Erreur suppression cours:", error);
    }
  };

  const handleModuleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/modules", {
        ...moduleFormData,
        coursId: selectedCoursId
      });
      refreshCache(`/api/modules/cours/${selectedCoursId}`);
      setShowModuleForm(false);
      setModuleFormData({ titre: "", description: "" });
      await loadModules(selectedCoursId);
    } catch (error) {
      console.error("Erreur création module:", error);
    }
  };

  const deleteModule = async (moduleId) => {
    if (!window.confirm("Supprimer ce module et tous ses sous-modules ?")) return;
    try {
      await api.delete(`/api/modules/${moduleId}`);
      refreshCache(`/api/modules/cours/${selectedCoursId}`);
      await loadModules(selectedCoursId);
      if (selectedModuleId === moduleId) {
        setSelectedModuleId(null);
      }
    } catch (error) {
      console.error("Erreur suppression module:", error);
    }
  };

  // =============================
  // HOOKS
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
      setSelectedModuleId(null);
    }
  }, [selectedCoursId]);

  // =============================
  // PROTECTION UI
  // =============================
  if (!token) {
    return <p style={{ textAlign: "center", padding: "50px" }}>⛔ Accès refusé</p>;
  }

  if (loading) {
    return <p style={{ textAlign: "center", padding: "50px" }}>⏳ Chargement...</p>;
  }

  // =============================
  // STYLES
  // =============================
  const styles = {
    container: { padding: "20px", maxWidth: "1400px", margin: "0 auto" },
    title: { fontSize: "28px", marginBottom: "20px", color: "#333" },
    tabs: { display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "1px solid #ddd", flexWrap: "wrap" },
    tab: (isActive) => ({
      padding: "12px 24px",
      cursor: "pointer",
      borderBottom: isActive ? "2px solid #007bff" : "none",
      color: isActive ? "#007bff" : "#666",
      fontWeight: isActive ? "bold" : "normal",
      background: "none",
      borderTop: "none",
      borderLeft: "none",
      borderRight: "none"
    }),
    statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" },
    statCard: { backgroundColor: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
    statValue: { fontSize: "28px", fontWeight: "bold", color: "#007bff", marginTop: "10px" },
    select: { width: "100%", maxWidth: "300px", padding: "10px", margin: "10px 0", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px" },
    input: { width: "100%", padding: "10px", margin: "10px 0", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px" },
    textarea: { width: "100%", padding: "10px", margin: "10px 0", borderRadius: "8px", border: "1px solid #ddd", minHeight: "80px" },
    button: { backgroundColor: "#007bff", color: "white", padding: "10px 20px", border: "none", borderRadius: "8px", cursor: "pointer", margin: "5px" },
    buttonDanger: { backgroundColor: "#dc3545", color: "white", padding: "5px 10px", border: "none", borderRadius: "4px", cursor: "pointer", marginLeft: "10px" },
    buttonSuccess: { backgroundColor: "#28a745", color: "white", padding: "10px 20px", border: "none", borderRadius: "8px", cursor: "pointer" },
    card: { backgroundColor: "white", borderRadius: "8px", padding: "15px", marginBottom: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
    tableContainer: { backgroundColor: "white", borderRadius: "12px", overflow: "auto", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", marginTop: "20px" },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { padding: "12px", textAlign: "left", backgroundColor: "#f8f9fa", borderBottom: "1px solid #ddd" },
    td: { padding: "12px", borderBottom: "1px solid #eee" }
  };

  // =============================
  // UI
  // =============================
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📊 Admin Dashboard</h1>

      <div style={styles.tabs}>
        <button style={styles.tab(activeTab === "dashboard")} onClick={() => setActiveTab("dashboard")}>
          📈 Dashboard
        </button>
        <button style={styles.tab(activeTab === "utilisateurs")} onClick={() => setActiveTab("utilisateurs")}>
          👥 Utilisateurs ({utilisateurs.length})
        </button>
        <button style={styles.tab(activeTab === "cours")} onClick={() => setActiveTab("cours")}>
          📚 Cours ({cours.length})
        </button>
        <button style={styles.tab(activeTab === "modules")} onClick={() => setActiveTab("modules")}>
          📦 Modules & Sous-modules
        </button>
      </div>

      {/* ==================== DASHBOARD ==================== */}
      {activeTab === "dashboard" && stats && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div>👥</div>
            <div style={styles.statValue}>{stats.totalUsers || 0}</div>
            <div>Utilisateurs</div>
          </div>
          <div style={styles.statCard}>
            <div>💎</div>
            <div style={styles.statValue}>{stats.abonnementsActifs || 0}</div>
            <div>Abonnements actifs</div>
          </div>
          <div style={styles.statCard}>
            <div>📚</div>
            <div style={styles.statValue}>{cours.length}</div>
            <div>Cours</div>
          </div>
          <div style={styles.statCard}>
            <div>💰</div>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: [0.9, 1], opacity: 1 }}
              transition={{ duration: 0.5 }}
              style={{ fontSize: "28px", fontWeight: "bold", color: "#28a745" }}
            >
              {stats.revenus?.toLocaleString() || 0} FCFA
            </motion.div>
            <div>Revenus</div>
          </div>
        </div>
      )}

      {/* ==================== UTILISATEURS ==================== */}
      {activeTab === "utilisateurs" && (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr><th style={styles.th}>Nom</th><th style={styles.th}>Email</th><th style={styles.th}>Rôle</th><th style={styles.th}>Actions</th></tr>
            </thead>
            <tbody>
              {utilisateurs.map(u => (
                <tr key={u._id}>
                  <td style={styles.td}>{u.prenom} {u.nom}</td>
                  <td style={styles.td}>{u.email}</td>
                  <td style={styles.td}>
                    <select value={u.role} onChange={(e) => changeRole(u._id, e.target.value)} style={styles.select}>
                      <option value="user">Utilisateur</option>
                      <option value="admin">Administrateur</option>
                    </select>
                  </td>
                  <td style={styles.td}>
                    <button style={styles.buttonDanger} onClick={() => deleteUser(u._id)}>🗑️ Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ==================== COURS ==================== */}
      {activeTab === "cours" && (
        <div>
          <button style={styles.buttonSuccess} onClick={() => setShowCoursForm(!showCoursForm)}>
            ➕ Nouveau cours
          </button>

          {showCoursForm && (
            <div style={styles.card}>
              <h3>{editingItem ? "Modifier" : "Ajouter"} un cours</h3>
              <input style={styles.input} placeholder="Titre" value={formData.titre} onChange={(e) => setFormData({...formData, titre: e.target.value})} />
              <textarea style={styles.textarea} placeholder="Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
              <input style={styles.input} type="number" placeholder="Prix (FCFA)" value={formData.prix} onChange={(e) => setFormData({...formData, prix: parseInt(e.target.value)})} />
              <input style={styles.input} placeholder="Année académique (ex: 2024-2025)" value={formData.anneeAcademique} onChange={(e) => setFormData({...formData, anneeAcademique: e.target.value})} />
              <label>
                <input type="checkbox" checked={formData.estPremium} onChange={(e) => setFormData({...formData, estPremium: e.target.checked})} />
                Cours premium
              </label>
              <div>
                <button style={styles.buttonSuccess} onClick={handleCoursSubmit}>💾 Sauvegarder</button>
                <button style={styles.buttonDanger} onClick={() => setShowCoursForm(false)}>❌ Annuler</button>
              </div>
            </div>
          )}

          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr><th style={styles.th}>Titre</th><th style={styles.th}>Année</th><th style={styles.th}>Prix</th><th style={styles.th}>Type</th><th style={styles.th}>Actions</th></tr>
              </thead>
              <tbody>
                {cours.map(c => (
                  <tr key={c._id}>
                    <td style={styles.td}>{c.titre}</td>
                    <td style={styles.td}>{c.anneeAcademique || "-"}</td>
                    <td style={styles.td}>{c.prix || 0} FCFA</td>
                    <td style={styles.td}>{c.estPremium ? "💎 Premium" : "🆓 Gratuit"}</td>
                    <td style={styles.td}>
                      <button style={styles.buttonDanger} onClick={() => deleteCours(c._id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== MODULES & SOUS-MODULES ==================== */}
      {activeTab === "modules" && (
        <div>
          <h3>📦 Gestion des modules</h3>

          <label>Sélectionner un cours :</label>
          <select style={styles.select} value={selectedCoursId || ""} onChange={(e) => setSelectedCoursId(e.target.value)}>
            <option value="">-- Choisir un cours --</option>
            {cours.map(c => <option key={c._id} value={c._id}>{c.titre}</option>)}
          </select>

          {selectedCoursId && (
            <>
              <button style={styles.buttonSuccess} onClick={() => setShowModuleForm(!showModuleForm)}>
                ➕ Nouveau module
              </button>

              {showModuleForm && (
                <div style={styles.card}>
                  <h3>Ajouter un module</h3>
                  <input style={styles.input} placeholder="Titre du module" value={moduleFormData.titre} onChange={(e) => setModuleFormData({...moduleFormData, titre: e.target.value})} />
                  <textarea style={styles.textarea} placeholder="Description" value={moduleFormData.description} onChange={(e) => setModuleFormData({...moduleFormData, description: e.target.value})} />
                  <div>
                    <button style={styles.buttonSuccess} onClick={handleModuleSubmit}>💾 Créer</button>
                    <button style={styles.buttonDanger} onClick={() => setShowModuleForm(false)}>❌ Annuler</button>
                  </div>
                </div>
              )}

              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr><th style={styles.th}>Module</th><th style={styles.th}>Description</th><th style={styles.th}>Sous-modules</th><th style={styles.th}>Actions</th></tr>
                  </thead>
                  <tbody>
                    {modules.map(m => (
                      <tr key={m._id}>
                        <td style={styles.td}><strong>{m.titre}</strong></td>
                        <td style={styles.td}>{m.description?.substring(0, 100)}</td>
                        <td style={styles.td}>{m.partiesCount || 0}</td>
                        <td style={styles.td}>
                          <button style={{ ...styles.button, backgroundColor: "#17a2b8" }} onClick={() => setSelectedModuleId(m._id)}>
                            📂 Voir
                          </button>
                          <button style={styles.buttonDanger} onClick={() => deleteModule(m._id)}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                    {modules.length === 0 && (
                      <tr><td colSpan="4" style={{ textAlign: "center", padding: "40px" }}>📭 Aucun module pour ce cours</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {selectedModuleId && (
                <div style={{ marginTop: "30px", padding: "20px", backgroundColor: "#f8f9fa", borderRadius: "12px" }}>
                  <h4>📄 Sous-modules</h4>
                  <GestionSousModules moduleId={selectedModuleId} token={token} />
                  <button style={styles.buttonDanger} onClick={() => setSelectedModuleId(null)}>❌ Fermer</button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}