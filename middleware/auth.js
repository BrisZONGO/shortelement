const jwt = require('jsonwebtoken');
const User = require('../models/User');

const SECRET_KEY =
  process.env.JWT_SECRET || 'votre_cle_secrete_tres_longue_et_complexe_123456789';

const extractToken = (req) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }

  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.split(' ')[1];
};

const protect = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Accès refusé. Token manquant'
      });
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id || decoded.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    if (user.actif === false) {
      return res.status(403).json({
        success: false,
        message: 'Compte désactivé'
      });
    }

    req.user = {
      id: user._id,
      userId: user._id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      telephone: user.telephone || '',
      role: user.role,
      abonnement: user.abonnement,
      actif: user.actif
    };

    next();
  } catch (error) {
    console.error('❌ Erreur auth protect:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Token invalide ou expiré'
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id || decoded.userId;

    if (!userId) {
      req.user = null;
      return next();
    }

    const user = await User.findById(userId).select('-password');

    if (!user || user.actif === false) {
      req.user = null;
      return next();
    }

    req.user = {
      id: user._id,
      userId: user._id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      telephone: user.telephone || '',
      role: user.role,
      abonnement: user.abonnement,
      actif: user.actif
    };

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Utilisateur non authentifié'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux administrateurs'
    });
  }

  next();
};

module.exports = {
  protect,
  optionalAuth,
  isAdmin
};

