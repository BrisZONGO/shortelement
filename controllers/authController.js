const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../middleware/auth');

// Inscription
const inscription = async (req, res) => {
  try {
    const { nom, prenom, email, password, role } = req.body;
    
    // Validation des champs obligatoires
    if (!nom || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Les champs nom, email et mot de passe sont requis' 
      });
    }
    // ========== PROFIL UTILISATEUR ==========
const getProfile = async (req, res) => {
  try {
    // ✅ req.user contient TOUTES les infos de l'utilisateur (ajouté par middleware auth.js)
    console.log("📋 Profil demandé par:", req.user.email);
    
    res.json({
      success: true,
      message: "Profil utilisateur",
      user: req.user  // L'utilisateur complet (sans mot de passe)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
    // Vérifier si l'utilisateur existe déjà
    const userExistant = await User.findOne({ email });
    if (userExistant) {
      return res.status(400).json({ 
        success: false,
        message: 'Cet email est déjà utilisé' 
      });
    }
    
    // Créer l'utilisateur (prenom optionnel)
    const user = new User({ 
      nom, 
      prenom: prenom || '',  // Valeur par défaut si non fourni
      email, 
      password, 
      role: role || 'user' 
    });
    
    await user.save();
    
    // Générer le token JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role }, 
      SECRET_KEY, 
      { expiresIn: '7d' }
    );
    
    // Réponse réussie
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
      message: 'Erreur serveur lors de l\'inscription', 
      error: error.message 
    });
  }
};

// Connexion
const connexion = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Les champs email et mot de passe sont requis' 
      });
    }
    
    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Email ou mot de passe incorrect' 
      });
    }
    
    // Vérifier le mot de passe
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ 
        success: false,
        message: 'Email ou mot de passe incorrect' 
      });
    }
    
    // Générer le token JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role }, 
      SECRET_KEY, 
      { expiresIn: '7d' }
    );
    
    // Réponse réussie
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
    console.error('Erreur connexion:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors de la connexion', 
      error: error.message 
    });
  }
};

module.exports = { 
  inscription, 
  connexion,
  getProfile  // ← Ajoutez cette ligne
};