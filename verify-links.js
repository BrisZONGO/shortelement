const mongoose = require('mongoose');
require('dotenv').config();

const Cours = require('./models/Cours');
const Module = require('./models/Module');
const Partie = require('./models/Partie');

const verifyLinks = async () => {
  try {
    console.log('🔍 VÉRIFICATION DES LIENS COURS → MODULES → SOUS-MODULES\n');
    console.log('='.repeat(60));

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    // 1. Récupérer tous les cours
    const cours = await Cours.find({ actif: true });
    console.log(`📚 TOTAL COURS: ${cours.length}\n`);

    for (const coursItem of cours) {
      console.log(`📖 COURS: ${coursItem.titre} (${coursItem.anneeAcademique || 'Année non définie'})`);
      console.log(`   ID: ${coursItem._id}`);
      console.log(`   Premium: ${coursItem.estPremium ? 'Oui' : 'Non'}`);
      console.log(`   Prix: ${coursItem.prix || 0} FCFA`);
      
      // 2. Récupérer les modules du cours
      const modules = await Module.find({ coursId: coursItem._id, actif: true });
      console.log(`   📦 NOMBRE DE MODULES: ${modules.length}`);
      
      if (modules.length === 0) {
        console.log('   ⚠️ Aucun module trouvé pour ce cours\n');
        continue;
      }
      
      for (const moduleItem of modules) {
        console.log(`\n   └─ 📘 MODULE: ${moduleItem.titre}`);
        console.log(`      ID: ${moduleItem._id}`);
        console.log(`      Description: ${moduleItem.description?.substring(0, 50)}...`);
        
        // 3. Récupérer les parties du module
        const parties = await Partie.find({ moduleId: moduleItem._id, actif: true });
        console.log(`      📄 NOMBRE DE SOUS-MODULES: ${parties.length}`);
        
        if (parties.length === 0) {
          console.log('      ⚠️ Aucun sous-module trouvé pour ce module');
        } else {
          for (const partie of parties) {
            console.log(`      └─ 📄 SOUS-MODULE: ${partie.titre}`);
            console.log(`         ID: ${partie._id}`);
            console.log(`         Type: ${partie.type}`);
            console.log(`         Durée: ${partie.duree || 'Non spécifiée'}`);
            console.log(`         Gratuit: ${partie.estGratuit ? 'Oui' : 'Non'}`);
          }
        }
      }
      console.log('\n' + '-'.repeat(50));
    }
    
    // 4. Vérification des incohérences
    console.log('\n🔍 VÉRIFICATION DES INCOHÉRENCES\n');
    
    // Modules sans cours valide
    const allModules = await Module.find();
    const orphanModules = [];
    for (const module of allModules) {
      const coursParent = await Cours.findById(module.coursId);
      if (!coursParent) {
        orphanModules.push(module);
      }
    }
    
    if (orphanModules.length > 0) {
      console.log(`⚠️ Modules orphelins (sans cours parent): ${orphanModules.length}`);
      orphanModules.forEach(m => console.log(`   - ${m.titre} (ID: ${m._id})`));
    } else {
      console.log('✅ Aucun module orphelin');
    }
    
    // Parties sans module valide
    const allParties = await Partie.find();
    const orphanParties = [];
    for (const partie of allParties) {
      const moduleParent = await Module.findById(partie.moduleId);
      if (!moduleParent) {
        orphanParties.push(partie);
      }
    }
    
    if (orphanParties.length > 0) {
      console.log(`⚠️ Sous-modules orphelins (sans module parent): ${orphanParties.length}`);
      orphanParties.forEach(p => console.log(`   - ${p.titre} (ID: ${p._id})`));
    } else {
      console.log('✅ Aucun sous-module orphelin');
    }
    
    // 5. Statistiques globales
    console.log('\n📊 STATISTIQUES GLOBALES\n');
    console.log(`Cours actifs: ${cours.length}`);
    console.log(`Modules actifs: ${allModules.length}`);
    console.log(`Sous-modules actifs: ${allParties.length}`);
    console.log(`\nMoyenne de modules par cours: ${(allModules.length / cours.length).toFixed(1)}`);
    console.log(`Moyenne de sous-modules par module: ${(allParties.length / allModules.length).toFixed(1)}`);
    
    await mongoose.disconnect();
    console.log('\n✅ Vérification terminée');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
};

verifyLinks();
