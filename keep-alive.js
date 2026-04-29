const https = require('https');
const { exec } = require('child_process');

console.log('🔄 Démarrage du service de ping...');
console.log('📡 URL cible: https://shortelement.onrender.com/health');

let consecutiveErrors = 0;

function pingAPI() {
  const startTime = Date.now();
  
  https.get('https://shortelement.onrender.com/health', (res) => {
    const duration = Date.now() - startTime;
    
    if (res.statusCode === 200) {
      consecutiveErrors = 0;
      console.log(`✅ [${new Date().toLocaleTimeString()}] Ping réussi (${duration}ms) - Status: ${res.statusCode}`);
    } else {
      console.log(`⚠️ [${new Date().toLocaleTimeString()}] Ping: Status ${res.statusCode}`);
    }
    
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.db === true) {
          console.log(`   📊 DB: connectée, Uptime: ${json.uptime?.toFixed(1)}s`);
        }
      } catch(e) {}
    });
    
  }).on('error', (err) => {
    consecutiveErrors++;
    console.error(`❌ [${new Date().toLocaleTimeString()}] Erreur ping: ${err.message}`);
    
    if (consecutiveErrors >= 3) {
      console.log('⚠️ Plusieurs erreurs consécutives - Vérifiez que le backend est déployé');
    }
  });
}

// Ping toutes les 4 minutes (240000 ms)
setInterval(pingAPI, 4 * 60 * 1000);

// Premier ping immédiat
console.log('🏓 Premier ping dans 2 secondes...');
setTimeout(pingAPI, 2000);

console.log('\n✅ Service de ping actif (intervalle: 4 minutes)');
console.log('   Appuyez sur Ctrl+C pour arrêter\n');