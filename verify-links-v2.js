const mongoose = require('mongoose');
require('dotenv').config();

const Cours = require('./models/Cours');
const Module = require('./models/Module');
const Partie = require('./models/Partie');

const verifyLinks = async () => {
  try {
    console.log('🔍 VÉRIFICATION DES LIENS COURS → MODULES → SOUS-MODULES\n');
    console.log('='.repeat(60));

    // Options de connexion avec timeout plus long
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    };

    console.log('🔄 Tentative de connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, options);
    console.log('✅ Connecté à MongoDB\n');

    // 1. Récupérer tous les cours
    const cours = await Cours.find({ actif: true });
    console.log(`📚 TOTAL COURS: ${cours.length}\n`);

    if (cours.length === 0) {
      console.log('⚠️ Aucun cours trouvé dans la base de données');
      console.log('💡 Créez d\'abord des cours avec: node create-test-data.js');
    }

    for (const coursItem of cours) {
      console.log(`📖 COURS: ${coursItem.titre} (${coursItem.anneeAcademique || 'Année non définie'})`);
      console.log(`   ID: ${coursItem._id}`);
      console.log(`   Premium: ${coursItem.estPremium ? 'Oui' : 'Non'}`);
      console.log(`   Prix: ${coursItem.prix || 0} FCFA`);
      
      const modules = await Module.find({ coursId: coursItem._id, actif: true });
      console.log(`   📦 NOMBRE DE MODULES: ${modules.length}`);
      
      if (modules.length === 0) {
        console.log('   ⚠️ Aucun module trouvé pour ce cours\n');
        continue;
      }
      
      for (const moduleItem of modules) {
        console.log(`\n   └─ 📘 MODULE: ${moduleItem.titre}`);
        console.log(`      ID: ${moduleItem._id}`);
        
        const parties = await Partie.find({ moduleId: moduleItem._id, actif: true });
        console.log(`      📄 NOMBRE DE SOUS-MODULES: ${parties.length}`);
        
        if (parties.length === 0) {
          console.log('      ⚠️ Aucun sous-module trouvé pour ce module');
        } else {
          for (const partie of parties) {
            console.log(`      └─ 📄 SOUS-MODULE: ${partie.titre}`);
            console.log(`         Type: ${partie.type}`);
          }
        }
      }
      console.log('\n' + '-'.repeat(50));
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Vérification terminée');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    
    if (error.message.includes('whitelist')) {
      console.log('\n💡 SOLUTION:');
      console.log('   1. Allez sur https://cloud.mongodb.com');
      console.log('   2. Cliquez sur "Network Access"');
      console.log('   3. Ajoutez 0.0.0.0/0');
      console.log('   4. Attendez 2-3 minutes');
      console.log('   5. Réexécutez ce script');
    }
    process.exit(1);
  }
};

verifyLinks();
