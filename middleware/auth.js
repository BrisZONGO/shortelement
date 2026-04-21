const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Clé secrète - Idéalement dans .env
const SECRET_KEY = process.env.JWT_SECRET || 'votre_cle_secrete_tres_longue_et_complexe_123456789';

// =============================
// 🔐 MIDDLEWARE PRINCIPAL
// =============================
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
    req.userEmail = decoded.email;
    
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }
    
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
const verifierAdmin = (req, res, next) => {
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
const verifierProprietaireOuAdmin = (req, res, next) => {
  const userId = req.params.id || req.params.userId;
  const currentUserId = req.userId || req.user?._id;
  const userRole = req.userRole || req.user?.role;
  
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
const verifierTokenOptionnel = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (token) {
    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      req.userId = decoded.userId;
      req.userRole = decoded.role;
      req.userEmail = decoded.email;
      
      const user = await User.findById(req.userId).select('-password');
      if (user) {
        req.user = user;
      }
    } catch (error) {
      // On ignore l'erreur
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
