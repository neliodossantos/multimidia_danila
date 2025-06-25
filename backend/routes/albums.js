const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, requireEditor } = require('../middleware/auth');

const router = express.Router();

// Listar álbuns
router.get('/', async (req, res) => {
  const { search, artist_id, genre, limit = 20, offset = 0 } = req.query;

  try {
    let query = `
      SELECT a.*, ar.name as artist_name 
      FROM albums a 
      LEFT JOIN artists ar ON a.artist_id = ar.id 
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (a.title LIKE ? OR a.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (artist_id) {
      query += ' AND a.artist_id = ?';
      params.push(artist_id);
    }

    if (genre) {
      query += ' AND a.genre = ?';
      params.push(genre);
    }

    query += ' ORDER BY a.release_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [albums] = await db.execute(query, params);

    res.json(albums);
  } catch (error) {
    console.error('Erro ao listar álbuns:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter álbum por ID
router.get('/:id', async (req, res) => {
  try {
    const [albums] = await db.execute(
      `SELECT a.*, ar.name as artist_name 
       FROM albums a 
       LEFT JOIN artists ar ON a.artist_id = ar.id 
       WHERE a.id = ?`,
      [req.params.id]
    );

    if (albums.length === 0) {
      return res.status(404).json({ error: 'Álbum não encontrado' });
    }

    // Obter músicas do álbum
    const [tracks] = await db.execute(
      'SELECT * FROM music WHERE album_id = ? ORDER BY track_number, title',
      [req.params.id]
    );

    res.json({
      ...albums[0],
      tracks
    });
  } catch (error) {
    console.error('Erro ao obter álbum:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar álbum
router.post('/', authenticateToken, requireEditor, [
  body('title').notEmpty().withMessage('Título do álbum é obrigatório'),
  body('artist_id').isInt().withMessage('ID do artista deve ser um número válido'),
  body('release_date').optional().isISO8601().withMessage('Data de lançamento deve estar no formato válido'),
  body('genre').optional().isLength({ max: 50 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, artist_id, description, genre, release_date, cover_url } = req.body;

  try {
    // Verificar se o artista existe
    const [artist] = await db.execute('SELECT id FROM artists WHERE id = ?', [artist_id]);
    if (artist.length === 0) {
      return res.status(400).json({ error: 'Artista não encontrado' });
    }

    const [result] = await db.execute(
      'INSERT INTO albums (title, artist_id, description, genre, release_date, cover_url, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, artist_id, description, genre, release_date, cover_url, req.user.id]
    );

    res.status(201).json({
      message: 'Álbum criado com sucesso',
      albumId: result.insertId
    });
  } catch (error) {
    console.error('Erro ao criar álbum:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar álbum
router.put('/:id', authenticateToken, requireEditor, async (req, res) => {
  const { title, artist_id, description, genre, release_date, cover_url } = req.body;

  try {
    // Verificar se o artista existe (se artist_id foi fornecido)
    if (artist_id) {
      const [artist] = await db.execute('SELECT id FROM artists WHERE id = ?', [artist_id]);
      if (artist.length === 0) {
        return res.status(400).json({ error: 'Artista não encontrado' });
      }
    }

    const [result] = await db.execute(
      'UPDATE albums SET title = ?, artist_id = ?, description = ?, genre = ?, release_date = ?, cover_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, artist_id, description, genre, release_date, cover_url, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Álbum não encontrado' });
    }

    res.json({ message: 'Álbum atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar álbum:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Eliminar álbum
router.delete('/:id', authenticateToken, requireEditor, async (req, res) => {
  try {
    const [result] = await db.execute(
      'DELETE FROM albums WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Álbum não encontrado' });
    }

    res.json({ message: 'Álbum eliminado com sucesso' });
  } catch (error) {
    console.error('Erro ao eliminar álbum:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;