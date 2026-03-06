const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  name: { 
    type: String, 
    required: true // El nombre de la pizarra, ej: "Línea temporal principal"
  },
  linkedProjects: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Project' // Aquí guardaremos los IDs de los proyectos que elegiste cruzar
  }],
  nodes: { 
    type: Array, 
    default: [] // Aquí se guardará la posición X, Y y los datos de cada nodo arrastrado
  },
  edges: { 
    type: Array, 
    default: [] // Aquí se guardarán las conexiones (flechas) entre los nodos
  }
}, { timestamps: true });

module.exports = mongoose.model('Board', boardSchema);