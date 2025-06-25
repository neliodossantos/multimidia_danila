
const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, requireEditor } = require('../middleware/auth');

const router = express.Router();

// Listar artistas
router.get('/', async (req, res) => {
  const { search, genre, limit = 20, offset = 0 } = req.query;

  try {
    let query = 'SELECT * FROM artists WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR biography LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (genre) {
      query += ' AND genre = ?';
      params.push(genre);
    }

    query += ' ORDER BY name LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [artists] = await db.execute(query, params);

    res.json(artists);
  } catch (error) {
    console.error('Erro ao listar artistas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter artista por ID
router.get('/:id', async (req, res) => {
  try {
    const [artists] = await db.execute(
      'SELECT * FROM artists WHERE id = ?',
      [req.params.id]
    );

    if (artists.length === 0) {
      return res.status(404).json({ error: 'Artista não encontrado' });
    }

    // Obter álbuns do artista
    const [albums] = await db.execute(
      'SELECT * FROM albums WHERE artist_id = ? ORDER BY release_date DESC',
      [req.params.id]
    );

    // Obter músicas do artista
    const [music] = await db.execute(
      'SELECT * FROM music WHERE artist_id = ? ORDER BY title',
      [req.params.id]
    );

    res.json({
      ...artists[0],
      albums,
      music
    });
  } catch (error) {
    console.error('Erro ao obter artista:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar artista
router.post('/', authenticateToken, requireEditor, [
  body('name').notEmpty().withMessage('Nome do artista é obrigatório'),
  body('genre').optional().isLength({ max: 50 }),
  body('country').optional().isLength({ max: 50 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, biography, genre, country, formedYear, imageUrl } = req.body;

  try {
    const [result] = await db.execute(
      'INSERT INTO artists (name, biography, genre, country, formed_year, image_url, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, biography, genre, country, formedYear, imageUrl, req.user.id]
    );

    res.status(201).json({
      message: 'Artista criado com sucesso',
      artistId: result.insertId
    });
  } catch (error) {
    console.error('Erro ao criar artista:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar artista
router.put('/:id', authenticateToken, requireEditor, async (req, res) => {
  const { name, biography, genre, country, formedYear, imageUrl } = req.body;

  try {
    const [result] = await db.execute(
      'UPDATE artists SET name = ?, biography = ?, genre = ?, country = ?, formed_year = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, biography, genre, country, formedYear, imageUrl, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Artista não encontrado' });
    }

    res.json({ message: 'Artista atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar artista:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Eliminar artista
router.delete('/:id', authenticateToken, requireEditor, async (req, res) => {
  try {
    const [result] = await db.execute(
      'DELETE FROM artists WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Artista não encontrado' });
    }

    res.json({ message: 'Artista eliminado com sucesso' });
  } catch (error) {
    console.error('Erro ao eliminar artista:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
