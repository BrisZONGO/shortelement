const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Clé secrète - Idéalement dans .env, mais on garde votre version
const SECRET_KEY = process.env.JWT_SECRET || 'votre_cle_secrete_tres_longue_et_complexe_123456789';

// Middleware pour vérifier le token (votre version existante améliorée)
const verifierToken = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Accès non autorisé - Token manquant' 
    });
  }
  
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.userEmail = decoded.email; // Ajout de l'email pour plus d'infos
    
    // Optionnel: Vérifier si l'utilisateur existe toujours en base
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token invalide' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token expiré' 
      });
    }
    return res.status(401).json({ 
      success: false,
      message: 'Erreur d\'authentification' 
    });
  }
};

// Middleware pour vérifier si c'est un admin (votre version existante)
const verifierAdmin = async (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Accès réservé aux administrateurs' 
    });
  }
  next();
};

// NOUVEAU: Middleware pour vérifier si l'utilisateur est propriétaire ou admin
const verifierProprietaireOuAdmin = (req, res, next) => {
  const userId = req.params.id || req.params.userId;
  
  // Si c'est l'utilisateur lui-même ou un admin, on autorise
  if (req.userId === userId || req.userRole === 'admin') {
    next();
  } else {
    return res.status(403).json({ 
      success: false,
      message: 'Accès non autorisé - Vous n\'êtes pas le propriétaire' 
    });
  }
};

// NOUVEAU: Middleware optionnel (ne bloque pas si pas de token)
const verifierTokenOptionnel = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (token) {
    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      req.userId = decoded.userId;
      req.userRole = decoded.role;
    } catch (error) {
      // On ignore l'erreur, l'utilisateur n'est pas authentifié
    }
  }
  next();
};

module.exports = { 
  verifierToken, 
  verifierAdmin, 
  verifierProprietaireOuAdmin,
  verifierTokenOptionnel,
  SECRET_KEY 
};