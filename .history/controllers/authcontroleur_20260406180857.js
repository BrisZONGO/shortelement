const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../middleware/auth');

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

module.exports = { inscription, connexion };
