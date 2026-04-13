// Ajoutez dans le schema
categorieId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Categorie',
  required: false
}