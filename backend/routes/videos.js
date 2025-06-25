const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, requireEditor } = require('../middleware/auth');

const router = express.Router();

// Listar vídeos
router.get('/', async (req, res) => {
  const { search, artist_id, genre, limit = 20, offset = 0 } = req.query;

  try {
    let query = `
      SELECT v.*, ar.name as artist_name 
      FROM videos v 
      LEFT JOIN artists ar ON v.artist_id = ar.id 
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (v.title LIKE ? OR v.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (artist_id) {
      query += ' AND v.artist_id = ?';
      params.push(artist_id);
    }

    if (genre) {
      query += ' AND v.genre = ?';
      params.push(genre);
    }

    query += ' ORDER BY v.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [videos] = await db.execute(query, params);

    res.json(videos);
  } catch (error) {
    console.error('Erro ao listar vídeos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter vídeo por ID
router.get('/:id', async (req, res) => {
  try {
    const [videos] = await db.execute(
      `SELECT v.*, ar.name as artist_name 
       FROM videos v 
       LEFT JOIN artists ar ON v.artist_id = ar.id 
       WHERE v.id = ?`,
      [req.params.id]
    );

    if (videos.length === 0) {
      return res.status(404).json({ error: 'Vídeo não encontrado' });
    }

    res.json(videos[0]);
  } catch (error) {
    console.error('Erro ao obter vídeo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar vídeo
router.post('/', authenticateToken, requireEditor, [
  body('title').notEmpty().withMessage('Título do vídeo é obrigatório'),
  body('artist_id').optional().isInt().withMessage('ID do artista deve ser um número válido'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duração deve ser um número positivo'),
  body('genre').optional().isLength({ max: 50 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, artist_id, duration, video_url, thumbnail_url, genre } = req.body;

  try {
    // Verificar se o artista existe (se fornecido)
    if (artist_id) {
      const [artist] = await db.execute('SELECT id FROM artists WHERE id = ?', [artist_id]);
      if (artist.length === 0) {
        return res.status(400).json({ error: 'Artista não encontrado' });
      }
    }

    const [result] = await db.execute(
      'INSERT INTO videos (title, description, artist_id, duration, video_url, thumbnail_url, genre, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description, artist_id, duration, video_url, thumbnail_url, genre, req.user.id]
    );

    res.status(201).json({
      message: 'Vídeo criado com sucesso',
      videoId: result.insertId
    });
  } catch (error) {
    console.error('Erro ao criar vídeo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar vídeo
router.put('/:id', authenticateToken, requireEditor, async (req, res) => {
  const { title, description, artist_id, duration, video_url, thumbnail_url, genre } = req.body;

  try {
    // Verificar se o artista existe (se fornecido)
    if (artist_id) {
      const [artist] = await db.execute('SELECT id FROM artists WHERE id = ?', [artist_id]);
      if (artist.length === 0) {
        return res.status(400).json({ error: 'Artista não encontrado' });
      }
    }

    const [result] = await db.execute(
      'UPDATE videos SET title = ?, description = ?, artist_id = ?, duration = ?, video_url = ?, thumbnail_url = ?, genre = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, description, artist_id, duration, video_url, thumbnail_url, genre, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Vídeo não encontrado' });
    }

    res.json({ message: 'Vídeo atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar vídeo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Eliminar vídeo
router.delete('/:id', authenticateToken, requireEditor, async (req, res) => {
  try {
    const [result] = await db.execute(
      'DELETE FROM videos WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Vídeo não encontrado' });
    }

    res.json({ message: 'Vídeo eliminado com sucesso' });
  } catch (error) {
    console.error('Erro ao eliminar vídeo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;