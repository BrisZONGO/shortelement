const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../middleware/auth');

// ========== FONCTIONS EXISTANTES ==========
// Inscription
const inscription = async (req, res) => {
  try {
    const { nom, email, password, role } = req.body;
    
    const userExistant = await User.findOne({ email });
    if (userExistant) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }
    
    const user = new User({ nom, email, password, role });
    await user.save();
    
    const token = jwt.sign({ userId: user._id, role: user.role }, SECRET_KEY, { expiresIn: '7d' });
    
    res.status(201).json({ token, user: { id: user._id, nom: user.nom, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Connexion
const connexion = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    
    const token = jwt.sign({ userId: user._id, role: user.role }, SECRET_KEY, { expiresIn: '7d' });
    
    res.json({ token, user: { id: user._id, nom: user.nom, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ========== NOUVELLES FONCTIONS À AJOUTER ==========

// Déconnexion
const deconnexion = async (req, res) => {
  res.json({ 
    success: true, 
    message: 'Déconnexion réussie' 
  });
};

// Obtenir le profil
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json({
      success: true,
      user: {
        id: user._id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Mettre à jour le profil
const updateProfile = async (req, res) => {
  try {
    const { nom, email } = req.body;
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    if (nom) user.nom = nom;
    if (email) {
      // Vérifier si l'email n'est pas déjà utilisé
      const emailExistant = await User.findOne({ email, _id: { $ne: req.userId } });
      if (emailExistant) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }
      user.email = email;
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: {
        id: user._id,
        nom: user.nom,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Récupérer tous les utilisateurs (admin uniquement)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Changer le rôle d'un utilisateur (admin uniquement)
const changeUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    // Vérifier si le rôle est valide
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide. Utilisez "user" ou "admin"' });
    }
    
    const user = await User.findByIdAndUpdate(
      userId, 
      { role }, 
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.json({
      success: true,
      message: `Rôle de l'utilisateur ${user.nom} changé en ${role}`,
      user
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Supprimer un utilisateur (admin uniquement)
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Empêcher l'auto-suppression
    if (userId === req.userId) {
      return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' });
    }
    
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.json({
      success: true,
      message: `Utilisateur ${user.nom} supprimé avec succès`
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ========== EXPORTATION DE TOUTES LES FONCTIONS ==========
module.exports = { 
  inscription, 
  connexion,
  deconnexion,
  getProfile,
  updateProfile,
  getAllUsers,
  changeUserRole,
  deleteUser
};