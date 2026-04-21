const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async () => {
  console.log('🔄 Test de connexion à MongoDB Atlas...\n');
  
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 30000
  };
  
  try {
    console.log('📡 Tentative de connexion...');
    await mongoose.connect(process.env.MONGODB_URI, options);
    console.log('✅✅✅ CONNEXION RÉUSSIE ! ✅✅✅');
    console.log('📊 Base de données:', mongoose.connection.name);
    console.log('🌐 Host:', mongoose.connection.host);
    console.log('📈 État:', mongoose.connection.readyState === 1 ? 'Connecté' : 'Déconnecté');
    
    await mongoose.disconnect();
    console.log('\n✅ Tout fonctionne parfaitement !');
    
  } catch (error) {
    console.error('❌ Échec de connexion:', error.message);
    console.log('\n💡 Solutions possibles:');
    console.log('   1. Allez sur https://cloud.mongodb.com');
    console.log('   2. Cliquez sur "Network Access"');
    console.log('   3. Ajoutez "0.0.0.0/0" dans la liste blanche');
    console.log('   4. Attendez 2-3 minutes');
    console.log('   5. Réessayez ce test');
  }
};

testConnection();
