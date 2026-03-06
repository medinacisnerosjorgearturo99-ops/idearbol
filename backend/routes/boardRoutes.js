const express = require('express');
const router = express.Router();
const Board = require('../models/Board');

// 1. Crear una nueva pizarra
router.post('/', async (req, res) => {
  try {
    const { userId, name, linkedProjects } = req.body;
    const newBoard = new Board({ userId, name, linkedProjects });
    const savedBoard = await newBoard.save();
    res.status(201).json(savedBoard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. Obtener todas las pizarras de un usuario
router.get('/:userId', async (req, res) => {
  try {
    const boards = await Board.find({ userId: req.params.userId }).populate('linkedProjects');
    res.status(200).json(boards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. Guardar/Actualizar una pizarra (posiciones de nodos, flechas o proyectos vinculados)
router.put('/:id', async (req, res) => {
  try {
    const { name, linkedProjects, nodes, edges } = req.body;
    const updatedBoard = await Board.findByIdAndUpdate(
      req.params.id,
      { name, linkedProjects, nodes, edges },
      { new: true } // Esto nos devuelve la versión ya actualizada
    );
    res.status(200).json(updatedBoard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4. Eliminar una pizarra
router.delete('/:id', async (req, res) => {
  try {
    await Board.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Pizarra eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;