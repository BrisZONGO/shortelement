import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { isUnlocked, getUnlockDate } from '../utils/dateUtils';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const CoursList = ({ user, refreshTrigger }) => {

  const [cours, setCours] = useState([]);
  const [coursPremium, setCoursPremium] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCours, setSelectedCours] = useState(null);
  const [showPayment, setShowPayment] = useState(false);

  // 🔐 abonnement
  const isPremiumUser = user?.abonnement?.actif === true;

  // =============================
  // 📚 FETCH COURS
  // =============================
  useEffect(() => {
    fetchCours();
  }, [refreshTrigger]);

  const fetchCours = async () => {
    try {
      setLoading(true);

      const response = await axios.get(`${API_URL}/api/cours`);
      setCours(response.data.cours || []);

      if (user?.token) {
        try {
          const premiumResponse = await axios.get(`${API_URL}/api/cours/premium/liste`, {
            headers: { Authorization: `Bearer ${user.token}` }
          });
          setCoursPremium(premiumResponse.data.cours || []);
        } catch {
          console.log("Accès premium refusé");
        }
      }

      setError(null);
    } catch (err) {
      console.error(err);
      setError("Erreur chargement cours");
    } finally {
      setLoading(false);
    }
  };

  // =============================
  // 🔍 FILTRE
  // =============================
  const getFilteredCours = () => {
    let filtered = [];

    if (activeTab === 'all') filtered = cours;
    if (activeTab === 'free') filtered = cours.filter(c => !c.estPremium);
    if (activeTab === 'premium') filtered = coursPremium;

    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  // =============================
  // 📊 GROUP BY YEAR (P3)
  // =============================
  const groupByYear = (cours) => {
    const grouped = {};

    cours.forEach(c => {
      const year = new Date(c.createdAt).getFullYear();
      const label = `${year}-${year + 1}`;

      if (!grouped[label]) grouped[label] = [];
      grouped[label].push(c);
    });

    return grouped;
  };

  const filteredCours = getFilteredCours();
  const groupedCours = groupByYear(filteredCours);

  // =============================
  // 💰 FORMAT PRIX
  // =============================
  const formatPrix = (prix) => {
    if (!prix || prix === 0) return 'Gratuit';
    return `${prix} FCFA`;
  };

  // =============================
  // 💳 ACHAT
  // =============================
  const handleAcheter = (cours) => {
    setSelectedCours(cours);
    setShowPayment(true);
  };

  // =============================
  // ⏳ LOADING
  // =============================
  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>⏳ Chargement...</div>;

  if (error) return <div style={{ color: 'red', textAlign: 'center' }}>❌ {error}</div>;

  // =============================
  // 🎨 UI
  // =============================
  return (
    <div style={{ maxWidth: '1200px', margin: 'auto', padding: '20px' }}>

      <h1>📚 Nos Cours</h1>

      {/* 🔍 SEARCH */}
      <input
        type="text"
        placeholder="Rechercher..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ padding: '10px', width: '100%', marginBottom: '20px' }}
      />

      {/* 🧭 TABS */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('all')}>Tous</button>
        <button onClick={() => setActiveTab('free')}>Gratuits</button>
        <button onClick={() => setActiveTab('premium')}>Premium</button>
      </div>

      {/* 🔒 MESSAGE PREMIUM */}
      {activeTab === 'premium' && !isPremiumUser && (
        <p style={{ color: 'orange' }}>
          🔒 Abonnement requis pour voir les cours premium
        </p>
      )}

      {/* 📦 GROUPED DISPLAY */}
      {Object.keys(groupedCours).length === 0 ? (
        <p>Aucun cours trouvé</p>
      ) : (
        Object.entries(groupedCours).map(([year, coursList]) => (
          <div key={year} style={{ marginBottom: '40px' }}>

            <h2 style={{ borderBottom: '2px solid #007bff', paddingBottom: '5px' }}>
              📅 Année académique {year}
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))',
              gap: '20px',
              marginTop: '20px'
            }}>
              {coursList.map((c, index) => {

                const weekIndex = c.semaine || index;
                const unlocked = isUnlocked(weekIndex, c.createdAt);
                const unlockDate = getUnlockDate(weekIndex, c.createdAt);

                return (
                  <div key={c._id} style={{
                    border: '1px solid #ddd',
                    padding: '15px',
                    borderRadius: '10px'
                  }}>

                    <h3>{c.titre}</h3>

                    <p>{c.description?.substring(0, 80)}...</p>

                    <p>💰 {formatPrix(c.prix)}</p>

                    {/* 🔒 PREMIUM */}
                    {c.estPremium && !isPremiumUser ? (
                      <button onClick={() => handleAcheter(c)}>
                        🔓 Acheter
                      </button>

                    ) : !unlocked ? (
                      <>
                        <button disabled>🔒 Bientôt disponible</button>
                        <p style={{ fontSize: '12px' }}>
                          📅 {unlockDate.toLocaleDateString()}
                        </p>
                      </>
                    ) : (
                      <button onClick={() => window.location.href = `/cours/${c._id}`}>
                        📖 Voir
                      </button>
                    )}

                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* 💳 MODAL */}
      {showPayment && selectedCours && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '10px' }}>
            <h3>{selectedCours.titre}</h3>
            <p>{formatPrix(selectedCours.prix)}</p>

            <button onClick={() => window.location.href = `/paiement/${selectedCours._id}`}>
              💳 Payer
            </button>

            <button onClick={() => setShowPayment(false)}>
              ❌ Annuler
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default CoursList;