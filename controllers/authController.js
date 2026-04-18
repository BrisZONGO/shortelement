const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../middleware/auth');

// Inscription
const inscription = async (req, res) => {
  try {
    const { nom, prenom, email, password, role } = req.body;
    
    if (!nom || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Les champs nom, email et mot de passe sont requis' 
      });
    }
    
    const userExistant = await User.findOne({ email });
    if (userExistant) {
      return res.status(400).json({ 
        success: false,
        message: 'Cet email est déjà utilisé' 
      });
    }
    
    const user = new User({ 
      nom, 
      prenom: prenom || '',
      email, 
      password, 
      role: role || 'user' 
    });
    
    await user.save();
    
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role }, 
      SECRET_KEY, 
      { expiresIn: '7d' }
    );
    
    res.status(201).json({ 
      success: true,
      token, 
      user: { 
        id: user._id, 
        nom: user.nom, 
        prenom: user.prenom,
        email: user.email, 
        role: user.role 
      } 
    });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
};

// Connexion
const connexion = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Email ou mot de passe incorrect' 
      });
    }
    
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ 
        success: false,
        message: 'Email ou mot de passe incorrect' 
      });
    }
    
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role }, 
      SECRET_KEY, 
      { expiresIn: '7d' }
    );
    
    res.json({ 
      success: true,
      token, 
      user: { 
        id: user._id, 
        nom: user.nom, 
        prenom: user.prenom,
        email: user.email, 
        role: user.role 
      } 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
};

// Profil utilisateur
const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Profil utilisateur",
      user: {
        id: req.user._id,
        nom: req.user.nom,
        prenom: req.user.prenom,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ✅ EXPORTATION - RIEN APRÈS CECI
module.exports = { 
  inscription, 
  connexion,
  getProfile
};