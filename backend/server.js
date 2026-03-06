const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const boardRoutes = require('./routes/boardRoutes');

const User = require('./models/User');
const Project = require('./models/Project');
const IdeaNode = require('./models/IdeaNode');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/boards', boardRoutes);

// --- 1. RUTAS DE AUTENTICACIÓN ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, username, email, password, initials } = req.body;
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) return res.status(400).json({ message: 'El correo o usuario ya existe' });

    const newUser = new User({ name, username, email, password, initials });
    await newUser.save();
    res.status(201).json({ message: 'Usuario creado', user: newUser });
  } catch (error) { res.status(500).json({ message: 'Error al registrar', error: error.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ $or: [{ email }, { username: email }], password });
    if (!user) return res.status(401).json({ message: 'Credenciales incorrectas' });
    res.status(200).json({ message: 'Login exitoso', user });
  } catch (error) { res.status(500).json({ message: 'Error al iniciar sesión', error: error.message }); }
});

// --- 2. RUTAS DE PROYECTOS ---
// Obtener los proyectos de un usuario específico
app.get('/api/projects/:userId', async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.params.userId });
    res.json(projects);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Crear un proyecto
app.post('/api/projects', async (req, res) => {
  try {
    const newProject = new Project(req.body);
    await newProject.save();
    res.json(newProject);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Actualizar un proyecto
app.put('/api/projects/:id', async (req, res) => {
  try {
    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Borrar un proyecto y todos sus nodos
app.delete('/api/projects/:id', async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    await IdeaNode.deleteMany({ projectId: req.params.id }); // Borra las ideas de ese proyecto
    res.json({ message: 'Proyecto eliminado' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});


// --- 3. RUTAS DE NODOS (IDEAS Y GRUPOS) ---
// Obtener los nodos de un proyecto
app.get('/api/nodes/:projectId', async (req, res) => {
  try {
    const nodes = await IdeaNode.find({ projectId: req.params.projectId });
    res.json(nodes);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Crear un nodo
app.post('/api/nodes', async (req, res) => {
  try {
    const newNode = new IdeaNode(req.body);
    await newNode.save();
    res.json(newNode);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Actualizar un nodo (título, descripción, sub-ideas o posición)
app.put('/api/nodes/:id', async (req, res) => {
  try {
    const updated = await IdeaNode.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Borrar un nodo
app.delete('/api/nodes/:id', async (req, res) => {
  try {
    await IdeaNode.findByIdAndDelete(req.params.id);
    res.json({ message: 'Nodo eliminado' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- ARRANQUE ---
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Conectado a MongoDB');
    app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));
  })
  .catch(err => console.error('❌ Error MongoDB:', err));