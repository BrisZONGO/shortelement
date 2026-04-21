const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔄 Test de connexion à MongoDB Atlas...\n');
console.log('⏳ Patientez 10 secondes...\n');

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000
};

mongoose.connect(process.env.MONGODB_URI, options)
  .then(() => {
    console.log('✅✅✅ CONNEXION RÉUSSIE ! ✅✅✅');
    console.log('📊 Base de données:', mongoose.connection.name);
    console.log('🌐 Host:', mongoose.connection.host);
    console.log('📈 État: Connecté');
    
    mongoose.disconnect();
    console.log('\n✨ Tout fonctionne parfaitement !');
    console.log('🚀 Vous pouvez maintenant lancer votre serveur.');
  })
  .catch(err => {
    console.error('❌ Échec de connexion:', err.message);
    console.log('\n💡 Actions à vérifier:');
    console.log('   1. Allez sur https://cloud.mongodb.com');
    console.log('   2. Network Access → Add IP Address');
    console.log('   3. Ajoutez "0.0.0.0/0"');
    console.log('   4. Attendez 2-3 minutes');
    console.log('   5. Réexécutez ce script');
  });
