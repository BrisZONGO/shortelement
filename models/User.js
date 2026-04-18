const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'L\'email est requis'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Le mot de passe est requis'],
        minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères']
    },
    nom: {
        type: String,
        required: [true, 'Le nom est requis'],
        trim: true
    },
    prenom: {
        type: String,
        trim: true,
        default: ''
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    actif: {
        type: Boolean,
        default: true
    },
    abonnement: {
        actif: { 
            type: Boolean, 
            default: false 
        },
        expiration: { 
            type: Date 
        },
        dateDebut: {
            type: Date,
            default: Date.now
        },
        forfait: {
            type: String,
            enum: ['mensuel', 'trimestriel', 'annuel', 'aucun'],
            default: 'aucun'
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hacher le mot de passe avant sauvegarde
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

// Méthode pour vérifier si l'abonnement est actif
userSchema.methods.isAbonnementActif = function() {
    if (!this.abonnement || !this.abonnement.actif) return false;
    if (!this.abonnement.expiration) return true;
    return new Date() < this.abonnement.expiration;
};

module.exports = mongoose.model('User', userSchema);