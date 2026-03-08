const mongoose = require('mongoose');

const ideaNodeSchema = new mongoose.Schema({
  label: { type: String, default: '' },
  type: { 
    type: String, 
    // 👇 Abrimos la puerta a las imágenes, notas y links del futuro 👇
    enum: ['idea', 'grupo', 'custom', 'image', 'nota', 'link'], 
    default: 'idea' 
  },
  description: { type: String },
  color: { type: String },
  parentId: { type: String, default: 'root' },
  // Relacionamos el nodo con un proyecto específico
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  position: {
    x: { type: Number, default: 100 },
    y: { type: Number, default: 100 }
  },
  // Sub-ideas anidadas
  subIdeas: { type: Array, default: [] }
}, { timestamps: true });

module.exports = mongoose.model('IdeaNode', ideaNodeSchema);