const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // À installer si pas déjà fait
const { SECRET_KEY } = require('../middleware/auth');

// ========== FONCTIONS EXISTANTES (conservées et améliorées) ==========

// Inscription
const inscription = async (req, res) => {
  try {
    const { nom, email, password, role } = req.body;
    
    // Validation des champs requis
    if (!nom || !email || !password) {
      return res.status(400).json({ message: 'Veuillez fournir tous les champs requis (nom, email, password)' });
    }
    
    // Vérifier si l'utilisateur existe déjà
    const userExistant = await User.findOne({ email });
    if (userExistant) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }
    
    // Créer le nouvel utilisateur
    const user = new User({ nom, email, password, role: role || 'user' });
    await user.save();
    
    // Générer le token JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role }, 
      SECRET_KEY, 
      { expiresIn: '7d' }
    );
    
    // Réponse complète
    res.status(201).json({ 
      success: true,
      token, 
      user: { 
        id: user._id, 
        nom: user.nom, 
        email: user.email, 
        role: user.role,
        createdAt: user.createdAt
      } 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Erreur serveur lors de l\'inscription', 
      error: error.message 
    });
  }
};

// Connexion
const connexion = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation des champs
    if (!email || !password) {
      return res.status(400).json({ message: 'Veuillez fournir email et mot de passe' });
    }
    
    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    
    // Vérifier le mot de passe (utilise la méthode du modèle)
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    
    // Générer le token JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role }, 
      SECRET_KEY, 
      { expiresIn: '7d' }
    );
    
    // Réponse complète
    res.json({ 
      success: true,
      token, 
      user: { 
        id: user._id, 
        nom: user.nom, 
        email: user.email, 
        role: user.role,
        createdAt: user.createdAt
      } 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Erreur serveur lors de la connexion', 
      error: error.message 
    });
  }
};

// ========== NOUVELLES FONCTIONS À AJOUTER (étape 4) ==========

// Obtenir le profil de l'utilisateur connecté (route protégée)
const getProfile = async (req, res) => {
  try {
    // req.user est ajouté par le middleware auth
    const user = await User.findById(req.user.userId).select('-password');
    
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
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Erreur lors de la récupération du profil', 
      error: error.message 
    });
  }
};

// Mettre à jour le profil utilisateur
const updateProfile = async (req, res) => {
  try {
    const { nom, email, password } = req.body;
    const userId = req.user.userId;
    
    // Trouver l'utilisateur
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Mettre à jour les champs
    if (nom) user.nom = nom;
    if (email) {
      // Vérifier si l'email n'est pas déjà utilisé par un autre utilisateur
      const emailExistant = await User.findOne({ email, _id: { $ne: userId } });
      if (emailExistant) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }
      user.email = email;
    }
    if (password) {
      user.password = password; // Le hachage se fait dans le pre-save du modèle
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
    res.status(500).json({ 
      message: 'Erreur lors de la mise à jour du profil', 
      error: error.message 
    });
  }
};

// Déconnexion (côté client, on supprime simplement le token)
const deconnexion = async (req, res) => {
  // Le token est géré côté client
  // On peut juste renvoyer un message de succès
  res.json({ 
    success: true, 
    message: 'Déconnexion réussie' 
  });
};

// Récupérer tous les utilisateurs (admin uniquement)
const getAllUsers = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    const users = await User.find().select('-password');
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des utilisateurs', 
      error: error.message 
    });
  }
};

// Changer le rôle d'un utilisateur (admin uniquement)
const changeUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    // Vérifier si l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    // Vérifier les rôles valides
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide' });
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
    res.status(500).json({ 
      message: 'Erreur lors du changement de rôle', 
      error: error.message 
    });
  }
};

// Supprimer un utilisateur (admin uniquement)
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Vérifier si l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    // Empêcher l'auto-suppression
    if (userId === req.user.userId) {
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
    res.status(500).json({ 
      message: 'Erreur lors de la suppression de l\'utilisateur', 
      error: error.message 
    });
  }
};

// ========== EXPORTATION DES FONCTIONS ==========
module.exports = { 
  inscription, 
  connexion,
  getProfile,
  updateProfile,
  deconnexion,
  getAllUsers,
  changeUserRole,
  deleteUser
};

