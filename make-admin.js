const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const makeAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const email = 'zobridel@yahoo.fr';
    
    const user = await User.findOneAndUpdate(
      { email: email },
      { role: 'admin' },
      { new: true }
    );
    
    if (user) {
      console.log(`✅ ${user.email} est maintenant administrateur !`);
      console.log(`🔑 Mot de passe actuel: Formation`);
    } else {
      console.log(`❌ Utilisateur ${email} non trouvé`);
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
};

makeAdmin();
