const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, requireEditor } = require('../middleware/auth');

const router = express.Router();

// Listar músicas
router.get('/', async (req, res) => {
  const { search, artist_id, album_id, limit = 20, offset = 0 } = req.query;

  try {
    let query = `
      SELECT m.*, ar.name as artist_name, al.title as album_title 
      FROM music m 
      LEFT JOIN artists ar ON m.artist_id = ar.id 
      LEFT JOIN albums al ON m.album_id = al.id 
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (m.title LIKE ? OR m.lyrics LIKE ? OR m.composer LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (artist_id) {
      query += ' AND m.artist_id = ?';
      params.push(artist_id);
    }

    if (album_id) {
      query += ' AND m.album_id = ?';
      params.push(album_id);
    }

    query += ' ORDER BY m.title LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [music] = await db.execute(query, params);

    res.json(music);
  } catch (error) {
    console.error('Erro ao listar músicas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter música por ID
router.get('/:id', async (req, res) => {
  try {
    const [music] = await db.execute(
      `SELECT m.*, ar.name as artist_name, al.title as album_title 
       FROM music m 
       LEFT JOIN artists ar ON m.artist_id = ar.id 
       LEFT JOIN albums al ON m.album_id = al.id 
       WHERE m.id = ?`,
      [req.params.id]
    );

    if (music.length === 0) {
      return res.status(404).json({ error: 'Música não encontrada' });
    }

    res.json(music[0]);
  } catch (error) {
    console.error('Erro ao obter música:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar música
router.post('/', authenticateToken, requireEditor, [
  body('title').notEmpty().withMessage('Título da música é obrigatório'),
  body('artist_id').isInt().withMessage('ID do artista deve ser um número válido'),
  body('album_id').optional().isInt().withMessage('ID do álbum deve ser um número válido'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duração deve ser um número positivo'),
  body('track_number').optional().isInt({ min: 1 }).withMessage('Número da faixa deve ser um número positivo')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, album_id, artist_id, duration, track_number, lyrics, composer, file_url } = req.body;

  try {
    // Verificar se o artista existe
    const [artist] = await db.execute('SELECT id FROM artists WHERE id = ?', [artist_id]);
    if (artist.length === 0) {
      return res.status(400).json({ error: 'Artista não encontrado' });
    }

    // Verificar se o álbum existe (se fornecido)
    if (album_id) {
      const [album] = await db.execute('SELECT id FROM albums WHERE id = ?', [album_id]);
      if (album.length === 0) {
        return res.status(400).json({ error: 'Álbum não encontrado' });
      }
    }

    const [result] = await db.execute(
      'INSERT INTO music (title, album_id, artist_id, duration, track_number, lyrics, composer, file_url, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, album_id, artist_id, duration, track_number, lyrics, composer, file_url, req.user.id]
    );

    res.status(201).json({
      message: 'Música criada com sucesso',
      musicId: result.insertId
    });
  } catch (error) {
    console.error('Erro ao criar música:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar música
router.put('/:id', authenticateToken, requireEditor, async (req, res) => {
  const { title, album_id, artist_id, duration, track_number, lyrics, composer, file_url } = req.body;

  try {
    // Verificar se o artista existe (se fornecido)
    if (artist_id) {
      const [artist] = await db.execute('SELECT id FROM artists WHERE id = ?', [artist_id]);
      if (artist.length === 0) {
        return res.status(400).json({ error: 'Artista não encontrado' });
      }
    }

    // Verificar se o álbum existe (se fornecido)
    if (album_id) {
      const [album] = await db.execute('SELECT id FROM albums WHERE id = ?', [album_id]);
      if (album.length === 0) {
        return res.status(400).json({ error: 'Álbum não encontrado' });
      }
    }

    const [result] = await db.execute(
      'UPDATE music SET title = ?, album_id = ?, artist_id = ?, duration = ?, track_number = ?, lyrics = ?, composer = ?, file_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, album_id, artist_id, duration, track_number, lyrics, composer, file_url, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Música não encontrada' });
    }

    res.json({ message: 'Música atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar música:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Eliminar música
router.delete('/:id', authenticateToken, requireEditor, async (req, res) => {
  try {
    const [result] = await db.execute(
      'DELETE FROM music WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Música não encontrada' });
    }

    res.json({ message: 'Música eliminada com sucesso' });
  } catch (error) {
    console.error('Erro ao eliminar música:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;