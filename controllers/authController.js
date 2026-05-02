const User = require('../models/User');
const jwt = require('jsonwebtoken');

const SECRET_KEY =
  process.env.JWT_SECRET || 'votre_cle_secrete_tres_longue_et_complexe_123456789';

const sanitizePhone = (value = '') => value.trim();

const buildUserResponse = (user) => ({
  id: user._id,
  nom: user.nom,
  prenom: user.prenom,
  email: user.email,
  telephone: user.telephone || '',
  role: user.role,
  abonnement: user.abonnement
});

// Inscription
const inscription = async (req, res) => {
  try {
    const { nom, prenom, password } = req.body;
    const email = req.body.email?.trim().toLowerCase();
    const telephone = sanitizePhone(req.body.telephone || '');

    if (!nom || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nom, email et mot de passe sont requis'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    const user = new User({
      nom: nom.trim(),
      prenom: (prenom || '').trim(),
      email,
      password,
      telephone,
      role: 'user'
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, userId: user._id, email: user.email, role: user.role },
      SECRET_KEY,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: buildUserResponse(user)
    });
  } catch (error) {
    console.error('❌ inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Connexion
const connexion = async (req, res) => {
  try {
    const password = req.body.password;
    const email = req.body.email?.trim().toLowerCase();

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
      { id: user._id, userId: user._id, email: user.email, role: user.role },
      SECRET_KEY,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: buildUserResponse(user)
    });
  } catch (error) {
    console.error('❌ connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

const profil = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    res.json({
      success: true,
      user: buildUserResponse(user)
    });
  } catch (error) {
    console.error('❌ profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

module.exports = {
  inscription,
  connexion,
  profil
};
