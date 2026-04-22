import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import GestionSousModules from "./GestionSousModules";

const API_URL = process.env.REACT_APP_API_URL || "https://shortelement.onrender.com";

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

  // 🔒 Protection accès
  if (!token) {
    return <p style={{ textAlign: "center", padding: "50px" }}>⛔ Accès refusé. Veuillez vous connecter.</p>;
  }

  // =============================
  // 📊 LOAD STATS
  // =============================
  const loadStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data.stats || res.data);
    } catch (error) {
      console.error("Erreur stats:", error);
    }
  };

  // =============================
  // 👥 LOAD UTILISATEURS
  // =============================
  const loadUtilisateurs = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUtilisateurs(res.data.users || []);
    } catch (error) {
      console.error("Erreur utilisateurs:", error);
    }
  };

  // =============================
  // 📚 LOAD COURS
  // =============================
  const loadCours = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/cours`);
      setCours(res.data.cours || []);
    } catch (error) {
      console.error("Erreur cours:", error);
    }
  };

  // =============================
  // 📦 LOAD MODULES
  // =============================
  const loadModules = async (coursId) => {
    if (!coursId) return;
    try {
      const res = await axios.get(`${API_URL}/api/modules/cours/${coursId}`);
      setModules(res.data.modules || []);
    } catch (error) {
      console.error("Erreur modules:", error);
      setModules([]);
    }
  };

  // =============================
  // 🗑️ SUPPRIMER UTILISATEUR
  // =============================
  const deleteUser = async (userId) => {
    if (!window.confirm("Supprimer cet utilisateur ?")) return;
    try {
      await axios.delete(`${API_URL}/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadUtilisateurs();
      loadStats();
    } catch (error) {
      console.error("Erreur suppression:", error);
    }
  };

  // =============================
  // 👑 CHANGER RÔLE
  // =============================
  const changeRole = async (userId, role) => {
    try {
      await axios.put(`${API_URL}/api/admin/users/${userId}/role`, { role }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadUtilisateurs();
    } catch (error) {
      console.error("Erreur changement rôle:", error);
    }
  };

  // =============================
  // ➕ CRÉER/MODIFIER COURS
  // =============================
  const handleCoursSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await axios.put(`${API_URL}/api/cours/${editingItem._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/api/cours`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowCoursForm(false);
      setEditingItem(null);
      setFormData({ titre: "", description: "", prix: 0, estPremium: false, anneeAcademique: "", image: "" });
      loadCours();
    } catch (error) {
      console.error("Erreur sauvegarde cours:", error);
    }
  };

  // =============================
  // 🗑️ SUPPRIMER COURS
  // =============================
  const deleteCours = async (coursId) => {
    if (!window.confirm("Supprimer ce cours ?")) return;
    try {
      await axios.delete(`${API_URL}/api/cours/${coursId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadCours();
      if (selectedCoursId === coursId) {
        setSelectedCoursId(null);
        setModules([]);
      }
    } catch (error) {
      console.error("Erreur suppression cours:", error);
    }
  };

  // =============================
  // ➕ CRÉER MODULE
  // =============================
  const handleModuleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/modules`, {
        ...formData,
        coursId: selectedCoursId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowModuleForm(false);
      setFormData({ titre: "", description: "", prix: 0, estPremium: false, anneeAcademique: "", image: "" });
      loadModules(selectedCoursId);
    } catch (error) {
      console.error("Erreur création module:", error);
    }
  };

  // =============================
  // 🔄 INIT
  // =============================
  useEffect(() => {
    loadStats();
    loadUtilisateurs();
    loadCours();
  }, []);

  useEffect(() => {
    if (selectedCoursId) {
      loadModules(selectedCoursId);
    }
  }, [selectedCoursId]);

  setLoading(false);

  // Styles
  const styles = {
    container: { padding: "20px", maxWidth: "1400px", margin: "0 auto" },
    header: { marginBottom: "30px" },
    title: { fontSize: "28px", color: "#333", marginBottom: "10px" },
    tabs: { display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "1px solid #ddd", flexWrap: "wrap" },
    tab: (isActive) => ({
      padding: "12px 24px",
      cursor: "pointer",
      borderBottom: isActive ? "2px solid #007bff" : "none",
      color: isActive ? "#007bff" : "#666",
      fontWeight: isActive ? "bold" : "normal"
    }),
    statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "30px" },
    statCard: { backgroundColor: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
    statValue: { fontSize: "28px", fontWeight: "bold", color: "#007bff", marginTop: "10px" },
    tableContainer: { backgroundColor: "white", borderRadius: "12px", overflow: "auto", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
    table: { width: "100%", borderCollapse: "collapse", minWidth: "600px" },
    th: { padding: "12px", textAlign: "left", backgroundColor: "#f8f9fa", borderBottom: "1px solid #ddd" },
    td: { padding: "12px", borderBottom: "1px solid #eee" },
    btnAdd: { backgroundColor: "#28a745", color: "white", padding: "10px 20px", border: "none", borderRadius: "8px", cursor: "pointer", marginBottom: "15px" },
    btnEdit: { backgroundColor: "#ffc107", color: "#333", padding: "5px 10px", border: "none", borderRadius: "4px", cursor: "pointer", marginRight: "5px" },
    btnDelete: { backgroundColor: "#dc3545", color: "white", padding: "5px 10px", border: "none", borderRadius: "4px", cursor: "pointer" },
    badge: (type) => ({
      padding: "4px 12px",
      borderRadius: "20px",
      fontSize: "12px",
      backgroundColor: type === "admin" ? "#ffc107" : "#28a745",
      color: "white",
      display: "inline-block"
    }),
    form: { backgroundColor: "#f8f9fa", padding: "20px", borderRadius: "8px", marginBottom: "20px" },
    input: { width: "100%", padding: "8px", marginBottom: "10px", border: "1px solid #ddd", borderRadius: "4px" },
    select: { width: "100%", padding: "8px", marginBottom: "10px", border: "1px solid #ddd", borderRadius: "4px" },
    label: { display: "block", marginBottom: "5px", fontWeight: "bold" }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📊 Tableau de bord Administrateur</h1>
      </div>

      {/* Onglets */}
      <div style={styles.tabs}>
        <div style={styles.tab(activeTab === "dashboard")} onClick={() => setActiveTab("dashboard")}>📈 Dashboard</div>
        <div style={styles.tab(activeTab === "utilisateurs")} onClick={() => setActiveTab("utilisateurs")}>👥 Utilisateurs ({utilisateurs.length})</div>
        <div style={styles.tab(activeTab === "cours")} onClick={() => setActiveTab("cours")}>📚 Cours ({cours.length})</div>
        <div style={styles.tab(activeTab === "modules")} onClick={() => setActiveTab("modules")}>📦 Modules & Sous-modules</div>
      </div>

      {/* ==================== TAB DASHBOARD ==================== */}
      {activeTab === "dashboard" && (
        <div>
          {!stats ? (
            <p>Chargement...</p>
          ) : (
            <div style={styles.statsGrid}>
              <motion.div style={styles.statCard} animate={{ scale: [0.9, 1] }} transition={{ duration: 0.3 }}>
                <div>👥</div>
                <div style={styles.statValue}>{stats.totalUsers || 0}</div>
                <div>Utilisateurs totaux</div>
              </motion.div>
              <motion.div style={styles.statCard} animate={{ scale: [0.9, 1] }} transition={{ duration: 0.3, delay: 0.1 }}>
                <div>💎</div>
                <div style={styles.statValue}>{stats.premiumUsers || stats.abonnementsActifs || 0}</div>
                <div>Abonnements actifs</div>
              </motion.div>
              <motion.div style={styles.statCard} animate={{ scale: [0.9, 1] }} transition={{ duration: 0.3, delay: 0.2 }}>
                <div>📚</div>
                <div style={styles.statValue}>{stats.totalCourses || cours.length}</div>
                <div>Cours disponibles</div>
              </motion.div>
              <motion.div style={styles.statCard} animate={{ scale: [0.9, 1] }} transition={{ duration: 0.3, delay: 0.3 }}>
                <div>💰</div>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: [0.9, 1], opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  style={{ fontSize: "28px", fontWeight: "bold", color: "#28a745" }}
                >
                  {stats.revenus?.toLocaleString() || 0} FCFA
                </motion.div>
                <div>Revenus totaux</div>
              </motion.div>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB UTILISATEURS ==================== */}
      {activeTab === "utilisateurs" && (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr><th style={styles.th}>Nom</th><th style={styles.th}>Email</th><th style={styles.th}>Rôle</th><th style={styles.th}>Abonnement</th><th style={styles.th}>Actions</th></tr>
            </thead>
            <tbody>
              {utilisateurs.map(u => (
                <tr key={u._id}>
                  <td style={styles.td}>{u.prenom} {u.nom}</td>
                  <td style={styles.td}>{u.email}</td>
                  <td style={styles.td}>
                    <select value={u.role} onChange={(e) => changeRole(u._id, e.target.value)} style={styles.select}>
                      <option value="user">Utilisateur</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td style={styles.td}>{u.abonnement?.actif ? "✅ Actif" : "❌ Inactif"}</td>
                  <td style={styles.td}>
                    <button style={styles.btnDelete} onClick={() => deleteUser(u._id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ==================== TAB COURS ==================== */}
      {activeTab === "cours" && (
        <div>
          <button style={styles.btnAdd} onClick={() => { setShowCoursForm(true); setEditingItem(null); setFormData({ titre: "", description: "", prix: 0, estPremium: false, anneeAcademique: "", image: "" }); }}>
            + Nouveau cours
          </button>

          {showCoursForm && (
            <form onSubmit={handleCoursSubmit} style={styles.form}>
              <h4>{editingItem ? "Modifier" : "Ajouter"} un cours</h4>
              <label style={styles.label}>Titre</label>
              <input style={styles.input} value={formData.titre} onChange={(e) => setFormData({ ...formData, titre: e.target.value })} required />
              <label style={styles.label}>Description</label>
              <textarea style={styles.input} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
              <label style={styles.label}>Prix (FCFA)</label>
              <input type="number" style={styles.input} value={formData.prix} onChange={(e) => setFormData({ ...formData, prix: parseInt(e.target.value) })} />
              <label style={styles.label}>Année académique</label>
              <input style={styles.input} value={formData.anneeAcademique} onChange={(e) => setFormData({ ...formData, anneeAcademique: e.target.value })} placeholder="2024-2025" />
              <label style={styles.label}>
                <input type="checkbox" checked={formData.estPremium} onChange={(e) => setFormData({ ...formData, estPremium: e.target.checked })} />
                Cours premium
              </label>
              <button type="submit" style={styles.btnAdd}>Sauvegarder</button>
              <button type="button" style={styles.btnDelete} onClick={() => setShowCoursForm(false)}>Annuler</button>
            </form>
          )}

          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>Titre</th><th style={styles.th}>Année</th><th style={styles.th}>Prix</th><th style={styles.th}>Type</th><th style={styles.th}>Actions</th></tr></thead>
              <tbody>
                {cours.map(c => (
                  <tr key={c._id}>
                    <td style={styles.td}>{c.titre}</td>
                    <td style={styles.td}>{c.anneeAcademique || "-"}</td>
                    <td style={styles.td}>{c.prix || 0} FCFA</td>
                    <td style={styles.td}><span style={styles.badge(c.estPremium ? "admin" : "user")}>{c.estPremium ? "Premium" : "Gratuit"}</span></td>
                    <td style={styles.td}>
                      <button style={styles.btnDelete} onClick={() => deleteCours(c._id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB MODULES & SOUS-MODULES ==================== */}
      {activeTab === "modules" && (
        <div>
          {/* Sélection du cours */}
          <div style={{ marginBottom: "20px" }}>
            <label style={styles.label}>Sélectionner un cours</label>
            <select style={styles.select} value={selectedCoursId || ""} onChange={(e) => setSelectedCoursId(e.target.value)}>
              <option value="">-- Choisir un cours --</option>
              {cours.map(c => <option key={c._id} value={c._id}>{c.titre} ({c.anneeAcademique})</option>)}
            </select>
          </div>

          {selectedCoursId && (
            <>
              {/* Gestion des modules */}
              <div style={{ marginTop: "20px" }}>
                <h3>📦 Modules du cours</h3>
                <button style={styles.btnAdd} onClick={() => { setShowModuleForm(true); setFormData({ titre: "", description: "" }); }}>
                  + Nouveau module
                </button>

                {showModuleForm && (
                  <form onSubmit={handleModuleSubmit} style={styles.form}>
                    <h4>Ajouter un module</h4>
                    <label style={styles.label}>Titre du module</label>
                    <input style={styles.input} value={formData.titre} onChange={(e) => setFormData({ ...formData, titre: e.target.value })} required />
                    <label style={styles.label}>Description</label>
                    <textarea style={styles.input} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                    <button type="submit" style={styles.btnAdd}>Créer</button>
                    <button type="button" style={styles.btnDelete} onClick={() => setShowModuleForm(false)}>Annuler</button>
                  </form>
                )}

                <div style={styles.tableContainer}>
                  <table style={styles.table}>
                    <thead><tr><th style={styles.th}>Module</th><th style={styles.th}>Description</th><th style={styles.th}>Actions</th></tr></thead>
                    <tbody>
                      {modules.map(m => (
                        <tr key={m._id}>
                          <td style={styles.td}><strong>{m.titre}</strong></td>
                          <td style={styles.td}>{m.description?.substring(0, 100)}</td>
                          <td style={styles.td}>
                            <button style={styles.btnEdit} onClick={() => { setSelectedModuleId(m._id); }}>📂 Voir sous-modules</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Gestion des sous-modules */}
                {selectedModuleId && (
                  <div style={{ marginTop: "30px", padding: "20px", backgroundColor: "#f8f9fa", borderRadius: "12px" }}>
                    <h4>📄 Sous-modules de : {modules.find(m => m._id === selectedModuleId)?.titre}</h4>
                    <GestionSousModules moduleId={selectedModuleId} token={token} />
                    <button style={styles.btnDelete} onClick={() => setSelectedModuleId(null)}>Fermer</button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}