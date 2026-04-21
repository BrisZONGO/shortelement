import React, { useState, useEffect } from 'react';
import axios from 'axios';

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

  // Récupérer les cours
  useEffect(() => {
    fetchCours();
  }, [refreshTrigger]);

  const fetchCours = async () => {
    try {
      setLoading(true);
      
      // Récupérer tous les cours
      const response = await axios.get(`${API_URL}/api/cours`);
      setCours(response.data.cours || []);
      
      // Récupérer les cours premium (si utilisateur connecté)
      if (user && user.token) {
        try {
          const premiumResponse = await axios.get(`${API_URL}/api/cours/premium/liste`, {
            headers: { Authorization: `Bearer ${user.token}` }
          });
          setCoursPremium(premiumResponse.data.cours || []);
        } catch (err) {
          console.log("Accès premium non disponible:", err.response?.data?.message);
        }
      }
      
      setError(null);
    } catch (err) {
      console.error("❌ Erreur chargement cours:", err);
      setError("Impossible de charger les cours");
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les cours
  const getFilteredCours = () => {
    let filtered = [];
    
    if (activeTab === 'all') {
      filtered = cours;
    } else if (activeTab === 'premium') {
      filtered = coursPremium;
    } else if (activeTab === 'free') {
      filtered = cours.filter(c => !c.estPremium);
    }
    
    // Recherche par mot-clé
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  // Vérifier si l'utilisateur a accès au cours premium
  const hasAccesPremium = () => {
    return user?.abonnement?.actif === true;
  };

  // Formater le prix
  const formatPrix = (prix) => {
    if (!prix || prix === 0) return 'Gratuit';
    return `${prix} FCFA`;
  };

  // Acheter un cours
  const handleAcheter = (cours) => {
    setSelectedCours(cours);
    setShowPayment(true);
  };

  // Styles CSS
  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      flexWrap: 'wrap'
    },
    title: {
      fontSize: '28px',
      color: '#333',
      marginBottom: '10px'
    },
    searchInput: {
      padding: '10px',
      fontSize: '16px',
      borderRadius: '8px',
      border: '1px solid #ddd',
      width: '250px'
    },
    tabs: {
      display: 'flex',
      gap: '10px',
      marginBottom: '20px',
      borderBottom: '1px solid #eee'
    },
    tab: (isActive) => ({
      padding: '10px 20px',
      cursor: 'pointer',
      borderBottom: isActive ? '2px solid #007bff' : 'none',
      color: isActive ? '#007bff' : '#666',
      fontWeight: isActive ? 'bold' : 'normal'
    }),
    coursGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '20px'
    },
    coursCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      transition: 'transform 0.3s, box-shadow 0.3s'
    },
    coursImage: {
      width: '100%',
      height: '180px',
      objectFit: 'cover',
      backgroundColor: '#f0f0f0'
    },
    coursContent: {
      padding: '16px'
    },
    coursTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '8px',
      color: '#333'
    },
    coursDescription: {
      fontSize: '14px',
      color: '#666',
      marginBottom: '12px',
      lineHeight: '1.4'
    },
    coursMeta: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '12px'
    },
    badge: (type) => ({
      padding: '4px 8px',
      borderRadius: '20px',
      fontSize: '12px',
      backgroundColor: type === 'premium' ? '#ffc107' : '#28a745',
      color: 'white'
    }),
    prix: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#007bff'
    },
    button: {
      width: '100%',
      padding: '10px',
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 'bold'
    },
    buttonDisabled: {
      width: '100%',
      padding: '10px',
      backgroundColor: '#6c757d',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      cursor: 'not-allowed'
    },
    loading: {
      textAlign: 'center',
      padding: '50px',
      fontSize: '18px',
      color: '#666'
    },
    error: {
      textAlign: 'center',
      padding: '20px',
      color: '#dc3545',
      backgroundColor: '#f8d7da',
      borderRadius: '8px',
      margin: '20px'
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      maxWidth: '400px',
      width: '90%'
    }
  };

  if (loading) {
    return <div style={styles.loading}>⏳ Chargement des cours...</div>;
  }

  if (error) {
    return <div style={styles.error}>❌ {error}</div>;
  }

  const filteredCours = getFilteredCours();
  const hasAccess = hasAccesPremium();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📚 Nos Cours</h1>
        <input
          type="text"
          placeholder="🔍 Rechercher un cours..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      <div style={styles.tabs}>
        <div style={styles.tab(activeTab === 'all')} onClick={() => setActiveTab('all')}>
          📖 Tous les cours ({cours.length})
        </div>
        <div style={styles.tab(activeTab === 'free')} onClick={() => setActiveTab('free')}>
          🆓 Gratuits ({cours.filter(c => !c.estPremium).length})
        </div>
        <div style={styles.tab(activeTab === 'premium')} onClick={() => setActiveTab('premium')}>
          💎 Premium ({coursPremium.length})
        </div>
      </div>

      {!hasAccess && activeTab === 'premium' && (
        <div style={{ ...styles.error, backgroundColor: '#fff3cd', color: '#856404' }}>
          💡 Les cours premium nécessitent un abonnement actif. 
          <a href="/abonnement" style={{ color: '#007bff', marginLeft: '10px' }}>
            S'abonner maintenant →
          </a>
        </div>
      )}

      <div style={styles.coursGrid}>
        {filteredCours.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
            Aucun cours trouvé
          </div>
        ) : (
          filteredCours.map((c) => (
            <div key={c._id} style={styles.coursCard}>
              <img 
                src={c.image || '/cours-default.jpg'} 
                alt={c.titre}
                style={styles.coursImage}
                onError={(e) => { e.target.src = '/cours-default.jpg' }}
              />
              <div style={styles.coursContent}>
                <h3 style={styles.coursTitle}>{c.titre}</h3>
                <p style={styles.coursDescription}>
                  {c.description?.substring(0, 100)}...
                </p>
                <div style={styles.coursMeta}>
                  <span style={styles.badge(c.estPremium ? 'premium' : 'free')}>
                    {c.estPremium ? '💎 Premium' : '🆓 Gratuit'}
                  </span>
                  <span style={styles.prix}>{formatPrix(c.prix)}</span>
                </div>
                {c.estPremium && !hasAccess ? (
                  <button 
                    style={styles.button}
                    onClick={() => handleAcheter(c)}
                  >
                    🔓 Débloquer l'accès
                  </button>
                ) : (
                  <button 
                    style={styles.button}
                    onClick={() => window.location.href = `/cours/${c._id}`}
                  >
                    📖 Voir le cours
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de paiement */}
      {showPayment && selectedCours && (
        <div style={styles.modalOverlay} onClick={() => setShowPayment(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>Paiement du cours</h3>
            <p><strong>{selectedCours.titre}</strong></p>
            <p>Prix: {formatPrix(selectedCours.prix)}</p>
            <button 
              style={styles.button}
              onClick={() => {
                // Rediriger vers la page de paiement
                window.location.href = `/paiement/${selectedCours._id}`;
              }}
            >
              Procéder au paiement
            </button>
            <button 
              style={{ ...styles.button, backgroundColor: '#6c757d', marginTop: '10px' }}
              onClick={() => setShowPayment(false)}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursList;