const jwt = require('jsonwebtoken');
const User = require('../models/User');

// =============================
// 🔐 SECRET KEY
// =============================
const SECRET_KEY = process.env.JWT_SECRET || 'votre_cle_secrete_tres_longue_et_complexe_123456789';

// =============================
// 🔐 MIDDLEWARE PRINCIPAL (PROTECT)
// =============================
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer')) {
    return res.status(401).json({
      success: false,
      message: 'Accès non autorisé - Token manquant'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    // ⚠️ STANDARDISATION : on utilise id (PAS userId)
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email || null
    };

    // Vérification user en base
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    req.userData = user;
    next();

  } catch (error) {

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Erreur authentification'
    });
  }
};

// =============================
// 👑 ADMIN ONLY
// =============================
const isAdmin = (req, res, next) => {
  const role = req.user?.role;

  if (role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux administrateurs'
    });
  }

  next();
};

// =============================
// 👤 OWNER OR ADMIN
// =============================
const isOwnerOrAdmin = (req, res, next) => {
  const targetId = req.params.id || req.params.userId;
  const currentUserId = req.user?.id;
  const role = req.user?.role;

  if (role === 'admin' || currentUserId === targetId) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Accès refusé - non autorisé'
  });
};

// =============================
// 🔓 OPTIONAL AUTH
// =============================
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    req.user = {
      id: decoded.id,
      role: decoded.role
    };

  } catch (error) {
    // on ignore volontairement
  }

  next();
};

// =============================
// 📤 EXPORT
// =============================
module.exports = {
  protect,
  isAdmin,
  isOwnerOrAdmin,
  optionalAuth,
  SECRET_KEY
};