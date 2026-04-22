const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async () => {
  console.log('🔄 Test de connexion à MongoDB Atlas...\n');

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI non trouvée dans .env');
    process.exit(1);
  }

  console.log('📡 URI:', uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });

    console.log('\n✅ CONNEXION RÉUSSIE !');
    console.log(`📊 Base de données: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n📁 Collections: ${collections.map(c => c.name).join(', ')}`);

    await mongoose.disconnect();
    console.log('\n✅ Test terminé');

  } catch (error) {
    console.error('\n❌ ÉCHEC DE CONNEXION');
    console.error(`Erreur: ${error.message}`);

    if (error.message.includes('whitelist')) {
      console.log('\n💡 SOLUTION: Ajoutez votre IP dans MongoDB Atlas');
      console.log('   https://cloud.mongodb.com → Network Access → Add IP');
    }
    process.exit(1);
  }
};

testConnection();
