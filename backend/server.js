const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const boardRoutes = require('./routes/boardRoutes');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client("464485765113-hhoskode74d67rfo2g3ncak15hgu4e0l.apps.googleusercontent.com");

const User = require('./models/User');
const Project = require('./models/Project');
const IdeaNode = require('./models/IdeaNode');

const app = express();
app.use(cors({
  origin: 'https://nodara.vercel.app', // <-- Poner el nuevo link aquí
  credentials: true
}));
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

// --- INICIO DE SESIÓN CON GOOGLE ---
app.post('/api/auth/google', async (req, res) => {
  try {
    const { token } = req.body;

    // 1. Desencriptamos el pase VIP con la herramienta de Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: "464485765113-hhoskode74d67rfo2g3ncak15hgu4e0l.apps.googleusercontent.com",
    });

    // 2. Sacamos los datos del usuario (Payload)
    const payload = ticket.getPayload();
    const { email, name } = payload;

    // 3. Buscamos si ese correo ya existe en tu Base de Datos
    let user = await User.findOne({ email });

    // 4. Si no existe, ¡lo registramos automáticamente!
    if (!user) {
      user = new User({
        name: name,
        email: email,
        username: email.split('@')[0] + Math.floor(Math.random() * 1000), // <-- Le inventamos un usuario único
        password: Math.random().toString(36).slice(-10), 
        initials: name.substring(0, 2).toUpperCase()
      });
      await user.save();
    }

    // 5. ¡Le damos acceso!
    res.status(200).json({ message: 'Login con Google exitoso', user });

  } catch (error) {
    console.error('Error verificando el token de Google:', error);
    res.status(401).json({ message: 'Token de Google inválido o expirado' });
  }
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