const mongoose = require('mongoose');
require('dotenv').config();

const testConnections = async () => {
  console.log('🔍 Diagnostic MongoDB Atlas\n');
  console.log('URI utilisée:', process.env.MONGODB_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
  
  // Tester avec différentes options
  const options = [
    {
      name: 'Option 1: Standard avec srv',
      uri: process.env.MONGODB_URI,
      opts: { serverSelectionTimeoutMS: 5000 }
    },
    {
      name: 'Option 2: Sans srv avec port',
      uri: 'mongodb://zobridel_db_user:yt53L8XgHCv7s3P9@cluster0.mugrdba.mongodb.net:27017/concours_db?retryWrites=true&w=majority&ssl=true&authSource=admin',
      opts: { serverSelectionTimeoutMS: 5000 }
    },
    {
      name: 'Option 3: Avec replicaSet',
      uri: 'mongodb://zobridel_db_user:yt53L8XgHCv7s3P9@cluster0-shard-00-00.mugrdba.mongodb.net:27017,cluster0-shard-00-01.mugrdba.mongodb.net:27017,cluster0-shard-00-02.mugrdba.mongodb.net:27017/concours_db?ssl=true&replicaSet=atlas-13w9d8-shard-0&authSource=admin&retryWrites=true&w=majority',
      opts: { serverSelectionTimeoutMS: 5000 }
    }
  ];
  
  for (const opt of options) {
    console.log(`\n📡 ${opt.name}`);
    try {
      await mongoose.connect(opt.uri, opt.opts);
      console.log('✅ Connexion réussie !');
      console.log('📊 Base de données:', mongoose.connection.name);
      await mongoose.disconnect();
      console.log('✅ Déconnexion réussie');
      break; // Sortir si une option fonctionne
    } catch (error) {
      console.log('❌ Échec:', error.message);
    }
  }
};

testConnections().catch(console.error);
