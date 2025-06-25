const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const socketManager = require('../utils/socketManager');

const router = express.Router();

// Listar notificações do utilizador
router.get('/', authenticateToken, async (req, res) => {
  const { limit = 20, offset = 0, unread_only = false } = req.query;

  try {
    let query = 'SELECT * FROM notifications WHERE user_id = ?';
    const params = [req.user.id];

    if (unread_only === 'true') {
      query += ' AND is_read = FALSE';
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [notifications] = await db.execute(query, params);

    // Contar total de notificações não lidas
    const [unreadCount] = await db.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [req.user.id]
    );

    res.json({
      notifications,
      unread_count: unreadCount[0].count
    });
  } catch (error) {
    console.error('Erro ao listar notificações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter notificação por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [notifications] = await db.execute(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (notifications.length === 0) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }

    res.json(notifications[0]);
  } catch (error) {
    console.error('Erro ao obter notificação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar notificação (apenas para administradores)
router.post('/', authenticateToken, requireAdmin, [
  body('user_id').isInt().withMessage('ID do utilizador deve ser um número'),
  body('type').isIn(['editor_promotion', 'content_update', 'group_invitation', 'file_share'])
    .withMessage('Tipo de notificação inválido'),
  body('title').notEmpty().withMessage('Título é obrigatório'),
  body('message').notEmpty().withMessage('Mensagem é obrigatória')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { user_id, type, title, message, data } = req.body;

  try {
    // Verificar se o utilizador existe
    const [users] = await db.execute('SELECT id FROM users WHERE id = ?', [user_id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }

    const [result] = await db.execute(
      'INSERT INTO notifications (user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?)',
      [user_id, type, title, message, data ? JSON.stringify(data) : null]
    );

    const notification = {
      id: result.insertId,
      user_id,
      type,
      title,
      message,
      data: data || null,
      is_read: false,
      created_at: new Date()
    };

    // Enviar notificação em tempo real
    socketManager.sendNotification(user_id, notification);

    res.status(201).json({
      message: 'Notificação criada com sucesso',
      notification
    });
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Marcar notificação como lida
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const [result] = await db.execute(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }

    res.json({ message: 'Notificação marcada como lida' });
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Marcar todas as notificações como lidas
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    await db.execute(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [req.user.id]
    );

    res.json({ message: 'Todas as notificações foram marcadas como lidas' });
  } catch (error) {
    console.error('Erro ao marcar todas as notificações como lidas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Eliminar notificação
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const [result] = await db.execute(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }

    res.json({ message: 'Notificação eliminada com sucesso' });
  } catch (error) {
    console.error('Erro ao eliminar notificação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Limpar todas as notificações lidas
router.delete('/clear-read', authenticateToken, async (req, res) => {
  try {
    const [result] = await db.execute(
      'DELETE FROM notifications WHERE user_id = ? AND is_read = TRUE',
      [req.user.id]
    );

    res.json({ 
      message: 'Notificações lidas eliminadas com sucesso',
      deleted_count: result.affectedRows
    });
  } catch (error) {
    console.error('Erro ao limpar notificações lidas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Funções auxiliares para criar notificações específicas

// Notificação de promoção a editor
const createEditorPromotionNotification = async (userId) => {
  try {
    const notification = {
      user_id: userId,
      type: 'editor_promotion',
      title: 'Parabéns! Você foi promovido a Editor',
      message: 'Agora você pode criar e editar conteúdo no ISPMedia. Aproveite suas novas permissões!',
      data: null
    };

    const [result] = await db.execute(
      'INSERT INTO notifications (user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?)',
      [notification.user_id, notification.type, notification.title, notification.message, notification.data]
    );

    notification.id = result.insertId;
    notification.is_read = false;
    notification.created_at = new Date();

    // Enviar notificação em tempo real
    socketManager.sendNotification(userId, notification);

    return notification;
  } catch (error) {
    console.error('Erro ao criar notificação de promoção:', error);
    throw error;
  }
};

// Notificação de atualização de conteúdo
const createContentUpdateNotification = async (userIds, title, message, data = null) => {
  try {
    const notifications = [];

    for (const userId of userIds) {
      const [result] = await db.execute(
        'INSERT INTO notifications (user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?)',
        [userId, 'content_update', title, message, data ? JSON.stringify(data) : null]
      );

      const notification = {
        id: result.insertId,
        user_id: userId,
        type: 'content_update',
        title,
        message,
        data,
        is_read: false,
        created_at: new Date()
      };

      notifications.push(notification);

      // Enviar notificação em tempo real
      socketManager.sendNotification(userId, notification);
    }

    return notifications;
  } catch (error) {
    console.error('Erro ao criar notificação de atualização:', error);
    throw error;
  }
};

// Notificação de convite para grupo
const createGroupInvitationNotification = async (userId, groupId, groupName, invitedBy) => {
  try {
    const notification = {
      user_id: userId,
      type: 'group_invitation',
      title: 'Convite para Grupo',
      message: `Você foi convidado para o grupo "${groupName}"`,
      data: {
        group_id: groupId,
        group_name: groupName,
        invited_by: invitedBy
      }
    };

    const [result] = await db.execute(
      'INSERT INTO notifications (user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?)',
      [notification.user_id, notification.type, notification.title, notification.message, JSON.stringify(notification.data)]
    );

    notification.id = result.insertId;
    notification.is_read = false;
    notification.created_at = new Date();

    // Enviar notificação em tempo real
    socketManager.sendNotification(userId, notification);

    return notification;
  } catch (error) {
    console.error('Erro ao criar notificação de convite:', error);
    throw error;
  }
};

// Notificação de partilha de ficheiro
const createFileShareNotification = async (userId, fileName, sharedBy) => {
  try {
    const notification = {
      user_id: userId,
      type: 'file_share',
      title: 'Ficheiro Partilhado',
      message: `${sharedBy} partilhou o ficheiro "${fileName}" consigo`,
      data: {
        file_name: fileName,
        shared_by: sharedBy
      }
    };

    const [result] = await db.execute(
      'INSERT INTO notifications (user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?)',
      [notification.user_id, notification.type, notification.title, notification.message, JSON.stringify(notification.data)]
    );

    notification.id = result.insertId;
    notification.is_read = false;
    notification.created_at = new Date();

    // Enviar notificação em tempo real
    socketManager.sendNotification(userId, notification);

    return notification;
  } catch (error) {
    console.error('Erro ao criar notificação de partilha:', error);
    throw error;
  }
};

// Exportar funções auxiliares
router.createEditorPromotionNotification = createEditorPromotionNotification;
router.createContentUpdateNotification = createContentUpdateNotification;
router.createGroupInvitationNotification = createGroupInvitationNotification;
router.createFileShareNotification = createFileShareNotification;

module.exports = router;