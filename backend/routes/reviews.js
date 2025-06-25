const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Listar reviews
router.get('/', async (req, res) => {
  const { album_id, user_id, limit = 20, offset = 0 } = req.query;

  try {
    let query = `
      SELECT r.*, u.username, u.first_name, u.last_name, al.title as album_title, ar.name as artist_name
      FROM reviews r 
      JOIN users u ON r.user_id = u.id 
      JOIN albums al ON r.album_id = al.id 
      JOIN artists ar ON al.artist_id = ar.id 
      WHERE 1=1
    `;
    const params = [];

    if (album_id) {
      query += ' AND r.album_id = ?';
      params.push(album_id);
    }

    if (user_id) {
      query += ' AND r.user_id = ?';
      params.push(user_id);
    }

    query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [reviews] = await db.execute(query, params);

    res.json(reviews);
  } catch (error) {
    console.error('Erro ao listar reviews:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter review por ID
router.get('/:id', async (req, res) => {
  try {
    const [reviews] = await db.execute(
      `SELECT r.*, u.username, u.first_name, u.last_name, al.title as album_title, ar.name as artist_name
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       JOIN albums al ON r.album_id = al.id 
       JOIN artists ar ON al.artist_id = ar.id 
       WHERE r.id = ?`,
      [req.params.id]
    );

    if (reviews.length === 0) {
      return res.status(404).json({ error: 'Review não encontrada' });
    }

    res.json(reviews[0]);
  } catch (error) {
    console.error('Erro ao obter review:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter estatísticas de reviews de um álbum
router.get('/stats/:album_id', async (req, res) => {
  try {
    const [stats] = await db.execute(
      `SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as rating_1,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as rating_2,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as rating_3,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as rating_4,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as rating_5
       FROM reviews 
       WHERE album_id = ?`,
      [req.params.album_id]
    );

    res.json(stats[0]);
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar review
router.post('/', authenticateToken, [
  body('album_id').isInt().withMessage('ID do álbum deve ser um número válido'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating deve ser entre 1 e 5'),
  body('comment').optional().isLength({ max: 1000 }).withMessage('Comentário deve ter no máximo 1000 caracteres')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { album_id, rating, comment } = req.body;

  try {
    // Verificar se o álbum existe
    const [album] = await db.execute('SELECT id FROM albums WHERE id = ?', [album_id]);
    if (album.length === 0) {
      return res.status(400).json({ error: 'Álbum não encontrado' });
    }

    // Verificar se o usuário já fez review deste álbum
    const [existingReview] = await db.execute(
      'SELECT id FROM reviews WHERE album_id = ? AND user_id = ?',
      [album_id, req.user.id]
    );

    if (existingReview.length > 0) {
      return res.status(400).json({ error: 'Você já fez uma review deste álbum' });
    }

    const [result] = await db.execute(
      'INSERT INTO reviews (album_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
      [album_id, req.user.id, rating, comment]
    );

    res.status(201).json({
      message: 'Review criada com sucesso',
      reviewId: result.insertId
    });
  } catch (error) {
    console.error('Erro ao criar review:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar review
router.put('/:id', authenticateToken, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating deve ser entre 1 e 5'),
  body('comment').optional().isLength({ max: 1000 }).withMessage('Comentário deve ter no máximo 1000 caracteres')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rating, comment } = req.body;

  try {
    // Verificar se a review existe e pertence ao usuário
    const [review] = await db.execute(
      'SELECT id FROM reviews WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (review.length === 0) {
      return res.status(404).json({ error: 'Review não encontrada ou você não tem permissão para editá-la' });
    }

    const [result] = await db.execute(
      'UPDATE reviews SET rating = ?, comment = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [rating, comment, req.params.id]
    );

    res.json({ message: 'Review atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar review:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Eliminar review
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Verificar se a review existe e pertence ao usuário
    const [review] = await db.execute(
      'SELECT id FROM reviews WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (review.length === 0) {
      return res.status(404).json({ error: 'Review não encontrada ou você não tem permissão para eliminá-la' });
    }

    const [result] = await db.execute(
      'DELETE FROM reviews WHERE id = ?',
      [req.params.id]
    );

    res.json({ message: 'Review eliminada com sucesso' });
  } catch (error) {
    console.error('Erro ao eliminar review:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;