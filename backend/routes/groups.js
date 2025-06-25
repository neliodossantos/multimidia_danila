const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const socketManager = require('../utils/socketManager');

const router = express.Router();

// Listar grupos
router.get('/', async (req, res) => {
  const { search, limit = 20, offset = 0, my_groups } = req.query;
  const userId = req.user?.id;

  try {
    let query;
    let params = [];

    if (my_groups === 'true' && userId) {
      // Listar apenas grupos do usuário (criados ou onde é membro)
      query = `
        SELECT DISTINCT g.*, u.username as creator_username,
               (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count,
               (CASE WHEN g.created_by = ? THEN 'owner' 
                     WHEN EXISTS(SELECT 1 FROM group_members WHERE group_id = g.id AND user_id = ?) THEN 'member' 
                     ELSE 'none' END) as user_role
        FROM groups g
        JOIN users u ON g.created_by = u.id
        LEFT JOIN group_members gm ON g.id = gm.group_id
        WHERE (g.created_by = ? OR gm.user_id = ?)
      `;
      params = [userId, userId, userId, userId];
    } else {
      // Listar grupos públicos
      query = `
        SELECT g.*, u.username as creator_username,
               (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
        FROM groups g
        JOIN users u ON g.created_by = u.id
        WHERE g.is_public = TRUE
      `;
    }

    if (search) {
      query += ' AND (g.name LIKE ? OR g.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY g.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [groups] = await db.execute(query, params);

    res.json(groups);
  } catch (error) {
    console.error('Erro ao listar grupos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter grupo por ID
router.get('/:id', async (req, res) => {
  const userId = req.user?.id;

  try {
    // Obter informações do grupo
    const [groups] = await db.execute(
      `SELECT g.*, u.username as creator_username,
              (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count,
              (CASE WHEN g.created_by = ? THEN 'owner' 
                    WHEN EXISTS(SELECT 1 FROM group_members WHERE group_id = g.id AND user_id = ?) THEN 'member' 
                    ELSE 'none' END) as user_role
       FROM groups g
       JOIN users u ON g.created_by = u.id
       WHERE g.id = ? AND (g.is_public = TRUE OR g.created_by = ? OR EXISTS(
         SELECT 1 FROM group_members WHERE group_id = g.id AND user_id = ?
       ))`,
      [userId || 0, userId || 0, req.params.id, userId || 0, userId || 0]
    );

    if (groups.length === 0) {
      return res.status(404).json({ error: 'Grupo não encontrado ou você não tem permissão para acessá-lo' });
    }

    // Obter membros do grupo (apenas se o usuário tem acesso)
    const [members] = await db.execute(
      `SELECT u.id, u.username, u.email, gm.joined_at, gm.role
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = ?
       ORDER BY gm.joined_at DESC`,
      [req.params.id]
    );

    // Obter discussões recentes do grupo
    const [discussions] = await db.execute(
      `SELECT gd.*, u.username as author_username,
              (SELECT COUNT(*) FROM group_discussion_replies WHERE discussion_id = gd.id) as replies_count
       FROM group_discussions gd
       JOIN users u ON gd.created_by = u.id
       WHERE gd.group_id = ?
       ORDER BY gd.updated_at DESC
       LIMIT 10`,
      [req.params.id]
    );

    res.json({
      ...groups[0],
      members,
      discussions
    });
  } catch (error) {
    console.error('Erro ao obter grupo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar grupo
router.post('/', authenticateToken, [
  body('name').notEmpty().withMessage('Nome do grupo é obrigatório')
    .isLength({ max: 100 }).withMessage('Nome deve ter no máximo 100 caracteres'),
  body('description').optional().isLength({ max: 500 }).withMessage('Descrição deve ter no máximo 500 caracteres'),
  body('is_public').optional().isBoolean().withMessage('is_public deve ser um valor booleano')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, is_public, image_url } = req.body;

  try {
    // Verificar se já existe um grupo com o mesmo nome
    const [existingGroups] = await db.execute(
      'SELECT id FROM groups WHERE name = ?',
      [name]
    );

    if (existingGroups.length > 0) {
      return res.status(400).json({ error: 'Já existe um grupo com este nome' });
    }

    const [result] = await db.execute(
      'INSERT INTO groups (name, description, is_public, image_url, created_by) VALUES (?, ?, ?, ?, ?)',
      [name, description, is_public || false, image_url, req.user.id]
    );

    res.status(201).json({
      message: 'Grupo criado com sucesso',
      groupId: result.insertId
    });
  } catch (error) {
    console.error('Erro ao criar grupo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar grupo
router.put('/:id', authenticateToken, [
  body('name').optional().notEmpty().withMessage('Nome do grupo não pode estar vazio')
    .isLength({ max: 100 }).withMessage('Nome deve ter no máximo 100 caracteres'),
  body('description').optional().isLength({ max: 500 }).withMessage('Descrição deve ter no máximo 500 caracteres'),
  body('is_public').optional().isBoolean().withMessage('is_public deve ser um valor booleano')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, is_public, image_url } = req.body;

  try {
    // Verificar se o usuário é o criador do grupo
    const [groups] = await db.execute(
      'SELECT id FROM groups WHERE id = ? AND created_by = ?',
      [req.params.id, req.user.id]
    );

    if (groups.length === 0) {
      return res.status(404).json({ error: 'Grupo não encontrado ou você não tem permissão para editá-lo' });
    }

    // Verificar se o novo nome já existe (se fornecido)
    if (name) {
      const [existingGroups] = await db.execute(
        'SELECT id FROM groups WHERE name = ? AND id != ?',
        [name, req.params.id]
      );

      if (existingGroups.length > 0) {
        return res.status(400).json({ error: 'Já existe um grupo com este nome' });
      }
    }

    const [result] = await db.execute(
      'UPDATE groups SET name = ?, description = ?, is_public = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, description, is_public, image_url, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Grupo não encontrado' });
    }

    res.json({ message: 'Grupo atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar grupo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Eliminar grupo
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Verificar se o usuário é o criador do grupo
    const [groups] = await db.execute(
      'SELECT id FROM groups WHERE id = ? AND created_by = ?',
      [req.params.id, req.user.id]
    );

    if (groups.length === 0) {
      return res.status(404).json({ error: 'Grupo não encontrado ou você não tem permissão para eliminá-lo' });
    }

    // Iniciar transação para eliminar grupo e dados relacionados
    await db.execute('START TRANSACTION');

    try {
      // Eliminar respostas das discussões
      await db.execute(
        'DELETE gdr FROM group_discussion_replies gdr JOIN group_discussions gd ON gdr.discussion_id = gd.id WHERE gd.group_id = ?',
        [req.params.id]
      );

      // Eliminar discussões do grupo
      await db.execute('DELETE FROM group_discussions WHERE group_id = ?', [req.params.id]);

      // Eliminar membros do grupo
      await db.execute('DELETE FROM group_members WHERE group_id = ?', [req.params.id]);

      // Eliminar o grupo
      await db.execute('DELETE FROM groups WHERE id = ?', [req.params.id]);

      await db.execute('COMMIT');

      res.json({ message: 'Grupo eliminado com sucesso' });
    } catch (error) {
      await db.execute('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Erro ao eliminar grupo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Juntar-se ao grupo
router.post('/:id/join', authenticateToken, async (req, res) => {
  try {
    // Verificar se o grupo existe e é público ou se o usuário foi convidado
    const [groups] = await db.execute(
      'SELECT id, name, is_public FROM groups WHERE id = ?',
      [req.params.id]
    );

    if (groups.length === 0) {
      return res.status(404).json({ error: 'Grupo não encontrado' });
    }

    if (!groups[0].is_public) {
      return res.status(403).json({ error: 'Este grupo é privado. Você precisa ser convidado.' });
    }

    // Verificar se já é membro
    const [existingMembers] = await db.execute(
      'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (existingMembers.length > 0) {
      return res.status(400).json({ error: 'Você já é membro deste grupo' });
    }

    // Adicionar como membro
    await db.execute(
      'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)',
      [req.params.id, req.user.id, 'member']
    );

    // Notificar o criador do grupo
    const [groupCreator] = await db.execute(
      'SELECT created_by FROM groups WHERE id = ?',
      [req.params.id]
    );

    if (groupCreator.length > 0) {
      socketManager.sendNotification(groupCreator[0].created_by, {
        type: 'group_join',
        message: `${req.user.username} juntou-se ao grupo "${groups[0].name}"`,
        data: { groupId: req.params.id, userId: req.user.id }
      });
    }

    res.json({ message: 'Juntou-se ao grupo com sucesso' });
  } catch (error) {
    console.error('Erro ao juntar-se ao grupo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Sair do grupo
router.post('/:id/leave', authenticateToken, async (req, res) => {
  try {
    // Verificar se é membro do grupo
    const [members] = await db.execute(
      'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (members.length === 0) {
      return res.status(400).json({ error: 'Você não é membro deste grupo' });
    }

    // Verificar se não é o criador do grupo
    const [groups] = await db.execute(
      'SELECT created_by FROM groups WHERE id = ?',
      [req.params.id]
    );

    if (groups.length > 0 && groups[0].created_by === req.user.id) {
      return res.status(400).json({ error: 'O criador do grupo não pode sair. Transfira a propriedade ou elimine o grupo.' });
    }

    // Remover do grupo
    await db.execute(
      'DELETE FROM group_members WHERE group_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    res.json({ message: 'Saiu do grupo com sucesso' });
  } catch (error) {
    console.error('Erro ao sair do grupo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Convidar usuário para o grupo
router.post('/:id/invite', authenticateToken, [
  body('username').notEmpty().withMessage('Nome de usuário é obrigatório')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username } = req.body;

  try {
    // Verificar se o usuário é criador ou admin do grupo
    const [groups] = await db.execute(
      `SELECT g.id, g.name FROM groups g
       WHERE g.id = ? AND (g.created_by = ? OR EXISTS(
         SELECT 1 FROM group_members WHERE group_id = g.id AND user_id = ? AND role = 'admin'
       ))`,
      [req.params.id, req.user.id, req.user.id]
    );

    if (groups.length === 0) {
      return res.status(404).json({ error: 'Grupo não encontrado ou você não tem permissão para convidar membros' });
    }

    // Verificar se o usuário a ser convidado existe
    const [users] = await db.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const invitedUserId = users[0].id;

    // Verificar se já é membro
    const [existingMembers] = await db.execute(
      'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
      [req.params.id, invitedUserId]
    );

    if (existingMembers.length > 0) {
      return res.status(400).json({ error: 'Este usuário já é membro do grupo' });
    }

    // Adicionar como membro
    await db.execute(
      'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)',
      [req.params.id, invitedUserId, 'member']
    );

    // Notificar o usuário convidado
    socketManager.sendNotification(invitedUserId, {
      type: 'group_invite',
      message: `Você foi convidado para o grupo "${groups[0].name}" por ${req.user.username}`,
      data: { groupId: req.params.id, invitedBy: req.user.id }
    });

    res.json({ message: 'Usuário convidado com sucesso' });
  } catch (error) {
    console.error('Erro ao convidar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Remover membro do grupo
router.delete('/:id/members/:userId', authenticateToken, async (req, res) => {
  try {
    // Verificar se o usuário é criador ou admin do grupo
    const [groups] = await db.execute(
      `SELECT g.id, g.created_by FROM groups g
       WHERE g.id = ? AND (g.created_by = ? OR EXISTS(
         SELECT 1 FROM group_members WHERE group_id = g.id AND user_id = ? AND role = 'admin'
       ))`,
      [req.params.id, req.user.id, req.user.id]
    );

    if (groups.length === 0) {
      return res.status(404).json({ error: 'Grupo não encontrado ou você não tem permissão para remover membros' });
    }

    // Não permitir remover o criador do grupo
    if (groups[0].created_by === parseInt(req.params.userId)) {
      return res.status(400).json({ error: 'Não é possível remover o criador do grupo' });
    }

    const [result] = await db.execute(
      'DELETE FROM group_members WHERE group_id = ? AND user_id = ?',
      [req.params.id, req.params.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Membro não encontrado' });
    }

    res.json({ message: 'Membro removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover membro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Alterar role de membro
router.put('/:id/members/:userId/role', authenticateToken, [
  body('role').isIn(['member', 'admin']).withMessage('Role deve ser member ou admin')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { role } = req.body;

  try {
    // Verificar se o usuário é criador do grupo
    const [groups] = await db.execute(
      'SELECT id FROM groups WHERE id = ? AND created_by = ?',
      [req.params.id, req.user.id]
    );

    if (groups.length === 0) {
      return res.status(404).json({ error: 'Grupo não encontrado ou você não tem permissão para alterar roles' });
    }

    const [result] = await db.execute(
      'UPDATE group_members SET role = ? WHERE group_id = ? AND user_id = ?',
      [role, req.params.id, req.params.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Membro não encontrado' });
    }

    res.json({ message: 'Role do membro atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao alterar role do membro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar discussões do grupo
router.get('/:id/discussions', async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  const userId = req.user?.id;

  try {
    // Verificar acesso ao grupo
    const [groups] = await db.execute(
      `SELECT id FROM groups WHERE id = ? AND (is_public = TRUE OR created_by = ? OR EXISTS(
         SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?
       ))`,
      [req.params.id, userId || 0, req.params.id, userId || 0]
    );

    if (groups.length === 0) {
      return res.status(404).json({ error: 'Grupo não encontrado ou você não tem permissão para ver as discussões' });
    }

    const [discussions] = await db.execute(
      `SELECT gd.*, u.username as author_username,
              (SELECT COUNT(*) FROM group_discussion_replies WHERE discussion_id = gd.id) as replies_count
       FROM group_discussions gd
       JOIN users u ON gd.created_by = u.id
       WHERE gd.group_id = ?
       ORDER BY gd.updated_at DESC
       LIMIT ? OFFSET ?`,
      [req.params.id, parseInt(limit), parseInt(offset)]
    );

    res.json(discussions);
  } catch (error) {
    console.error('Erro ao listar discussões:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar discussão no grupo
router.post('/:id/discussions', authenticateToken, [
  body('title').notEmpty().withMessage('Título é obrigatório')
    .isLength({ max: 200 }).withMessage('Título deve ter no máximo 200 caracteres'),
  body('content').notEmpty().withMessage('Conteúdo é obrigatório')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, content } = req.body;

  try {
    // Verificar se o usuário é membro do grupo
    const [access] = await db.execute(
      `SELECT g.id FROM groups g
       WHERE g.id = ? AND (g.created_by = ? OR EXISTS(
         SELECT 1 FROM group_members WHERE group_id = g.id AND user_id = ?
       ))`,
      [req.params.id, req.user.id, req.user.id]
    );

    if (access.length === 0) {
      return res.status(403).json({ error: 'Você precisa ser membro do grupo para criar discussões' });
    }

    const [result] = await db.execute(
      'INSERT INTO group_discussions (group_id, title, content, created_by) VALUES (?, ?, ?, ?)',
      [req.params.id, title, content, req.user.id]
    );

    res.status(201).json({
      message: 'Discussão criada com sucesso',
      discussionId: result.insertId
    });
  } catch (error) {
    console.error('Erro ao criar discussão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;