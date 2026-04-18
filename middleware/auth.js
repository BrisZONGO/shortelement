const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Clé secrète - Idéalement dans .env
const SECRET_KEY = process.env.JWT_SECRET || 'votre_cle_secrete_tres_longue_et_complexe_123456789';

// =============================
// 🔐 MIDDLEWARE PRINCIPAL
// =============================
// Vérifie le token et charge l'utilisateur complet
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
    
    // Stocker les infos du token
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.userEmail = decoded.email;
    
    // ✅ IMPORTANT : Récupérer l'utilisateur complet depuis la base de données
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }
    
    // ✅ Ajouter l'objet utilisateur complet à la requête
    req.user = user;
    
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

// =============================
// 👑 MIDDLEWARE ADMIN
// =============================
// Vérifie si l'utilisateur est admin
const verifierAdmin = async (req, res, next) => {
  // Utiliser req.userRole ou req.user.role
  const userRole = req.userRole || req.user?.role;
  
  if (userRole !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Accès réservé aux administrateurs' 
    });
  }
  next();
};

// =============================
// 👤 MIDDLEWARE PROPRIÉTAIRE
// =============================
// Vérifie si l'utilisateur est propriétaire ou admin
const verifierProprietaireOuAdmin = (req, res, next) => {
  const userId = req.params.id || req.params.userId;
  const currentUserId = req.userId || req.user?._id;
  const userRole = req.userRole || req.user?.role;
  
  // Si c'est l'utilisateur lui-même ou un admin, on autorise
  if (currentUserId === userId || userRole === 'admin') {
    next();
  } else {
    return res.status(403).json({ 
      success: false,
      message: 'Accès non autorisé - Vous n\'êtes pas le propriétaire' 
    });
  }
};

// =============================
// 🔓 MIDDLEWARE OPTIONNEL
// =============================
// Ne bloque pas si pas de token, mais charge l'utilisateur si token présent
const verifierTokenOptionnel = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (token) {
    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      req.userId = decoded.userId;
      req.userRole = decoded.role;
      req.userEmail = decoded.email;
      
      // Charger l'utilisateur complet si disponible
      const user = await User.findById(req.userId).select('-password');
      if (user) {
        req.user = user;
      }
    } catch (error) {
      // On ignore l'erreur, l'utilisateur n'est pas authentifié
    }
  }
  next();
};

// =============================
// 📤 EXPORTATION
// =============================
module.exports = { 
  verifierToken, 
  verifierAdmin, 
  verifierProprietaireOuAdmin,
  verifierTokenOptionnel,
  SECRET_KEY 
};