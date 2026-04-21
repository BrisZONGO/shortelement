require('dotenv').config();

console.log('🔍 Vérification configuration:');
console.log('MONGODB_URI existe:', !!process.env.MONGODB_URI);
console.log('URI masquée:', process.env.MONGODB_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
console.log('\n💡 Si les identifiants sont corrects et l\'IP autorisée, la connexion devrait fonctionner');
