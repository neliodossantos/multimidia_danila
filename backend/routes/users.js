
const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, requireEditor, requireAdmin } = require('../middleware/auth');
const socketManager = require('../utils/socketManager');

const router = express.Router();

// Listar utilizadores (apenas para editores/admins)
router.get('/', authenticateToken, requireEditor, async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, username, email, first_name, last_name, is_editor, is_admin, avatar_url, created_at FROM users ORDER BY created_at DESC'
    );

    res.json(users);
  } catch (error) {
    console.error('Erro ao listar utilizadores:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter perfil de utilizador
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, username, email, first_name, last_name, is_editor, is_admin, avatar_url, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar perfil
router.put('/profile', authenticateToken, [
  body('firstName').optional().notEmpty().withMessage('Primeiro nome não pode estar vazio'),
  body('lastName').optional().notEmpty().withMessage('Último nome não pode estar vazio'),
  body('email').optional().isEmail().withMessage('Email inválido')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { firstName, lastName, email } = req.body;

  try {
    const updates = [];
    const values = [];

    if (firstName) {
      updates.push('first_name = ?');
      values.push(firstName);
    }
    if (lastName) {
      updates.push('last_name = ?');
      values.push(lastName);
    }
    if (email) {
      updates.push('email = ?');
      values.push(email);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    values.push(req.user.id);

    await db.execute(
      `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );

    res.json({ message: 'Perfil atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Promover utilizador a editor
router.post('/:userId/promote', authenticateToken, requireEditor, async (req, res) => {
  const { userId } = req.params;

  try {
    // Verificar se o utilizador existe
    const [users] = await db.execute(
      'SELECT id, username, is_editor FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }

    const user = users[0];

    if (user.is_editor) {
      return res.status(400).json({ error: 'Utilizador já é editor' });
    }

    // Promover a editor
    await db.execute(
      'UPDATE users SET is_editor = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [userId]
    );

    // Criar notificação
    await db.execute(
      'INSERT INTO notifications (user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?)',
      [
        userId,
        'editor_promotion',
        'Promoção a Editor',
        'Parabéns! Foi promovido a editor e agora pode criar e modificar conteúdos.',
        JSON.stringify({ promoted_by: req.user.username })
      ]
    );

    // Enviar notificação em tempo real
    socketManager.sendNotification(userId, {
      type: 'editor_promotion',
      title: 'Promoção a Editor',
      message: 'Parabéns! Foi promovido a editor e agora pode criar e modificar conteúdos.',
      data: { promoted_by: req.user.username }
    });

    res.json({ message: `Utilizador ${user.username} promovido a editor com sucesso` });
  } catch (error) {
    console.error('Erro ao promover utilizador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
