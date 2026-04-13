const jwt = require('jsonwebtoken');
const User = require('../models/User');

const SECRET_KEY = 'votre_cle_secrete_tres_longue_et_complexe_123456789';

// Middleware pour vérifier le token
const verifierToken = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Accès non autorisé' });
  }
  
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalide' });
  }
};

// Middleware pour vérifier si c'est un admin
const verifierAdmin = async (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
  }
  next();
};

module.exports = { verifierToken, verifierAdmin, SECRET_KEY };