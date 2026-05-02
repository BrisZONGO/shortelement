import React, { useState } from 'react';
import api from '../services/api';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let res;
      const payload = {
        email: email.trim().toLowerCase(),
        password
      };

      if (isLogin) {
        res = await api.post('/api/auth/connexion', payload);
      } else {
        res = await api.post('/api/auth/inscription', {
          nom: nom.trim(),
          prenom: prenom.trim(),
          telephone: telephone.trim(),
          ...payload
        });
      }

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userRole', res.data.user.role);

      alert(isLogin ? 'Connexion réussie 🚀' : 'Inscription réussie 🚀');

      if (onLogin) {
        onLogin(res.data.token, res.data.user);
      }
    } catch (err) {
      alert(
        err.response?.data?.message ||
          (isLogin ? 'Erreur login' : 'Erreur inscription')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>📚 Application Concours</h1>

      <div
        style={{
          display: 'inline-block',
          textAlign: 'left',
          marginTop: '30px',
          padding: '30px',
          border: '1px solid #ddd',
          borderRadius: '10px',
          backgroundColor: '#f9f9f9',
          maxWidth: '400px',
          width: '100%'
        }}
      >
        <h2>{isLogin ? '🔐 Connexion' : '📝 Inscription'}</h2>

        <button
          onClick={() => setIsLogin(!isLogin)}
          style={{ marginBottom: '20px', width: '100%', padding: '10px' }}
        >
          {isLogin ? 'Créer un compte' : 'Déjà inscrit ? Se connecter'}
        </button>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div style={{ marginBottom: '10px' }}>
                <label>Nom *</label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label>Prénom</label>
                <input
                  type="text"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label>Numéro WhatsApp</label>
                <input
                  type="text"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  placeholder="226XXXXXXXX"
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
            </>
          )}

          <div style={{ marginBottom: '10px' }}>
            <label>Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '8px' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label>Mot de passe *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '8px' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '5px'
            }}
          >
            {loading ? 'Chargement...' : isLogin ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
