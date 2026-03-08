const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  color: { type: String, default: '#6366f1' },
  // Aquí ocurre la magia: Relacionamos el proyecto con el usuario que lo creó
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // 👇 AQUÍ ESTÁ LA NUEVA MEMORIA DE LA CÁMARA 👇
  lastViewport: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    zoom: { type: Number, default: 1 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);