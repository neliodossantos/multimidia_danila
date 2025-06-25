const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Listar arquivos do usuário
router.get('/', authenticateToken, async (req, res) => {
  const { search, limit = 20, offset = 0 } = req.query;

  try {
    let query = `
      SELECT sf.*, m.title as music_title, v.title as video_title
      FROM shared_files sf 
      LEFT JOIN music m ON sf.music_id = m.id 
      LEFT JOIN videos v ON sf.video_id = v.id 
      WHERE sf.owner_id = ?
    `;
    const params = [req.user.id];

    if (search) {
      query += ' AND (sf.filename LIKE ? OR sf.original_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY sf.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [files] = await db.execute(query, params);

    res.json(files);
  } catch (error) {
    console.error('Erro ao listar arquivos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar arquivos públicos
router.get('/public', async (req, res) => {
  const { search, limit = 20, offset = 0 } = req.query;

  try {
    let query = `
      SELECT sf.*, u.username as owner_username, m.title as music_title, v.title as video_title
      FROM shared_files sf 
      JOIN users u ON sf.owner_id = u.id 
      LEFT JOIN music m ON sf.music_id = m.id 
      LEFT JOIN videos v ON sf.video_id = v.id 
      WHERE sf.is_public = TRUE
    `;
    const params = [];

    if (search) {
      query += ' AND (sf.filename LIKE ? OR sf.original_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY sf.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [files] = await db.execute(query, params);

    res.json(files);
  } catch (error) {
    console.error('Erro ao listar arquivos públicos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar arquivos compartilhados com o usuário
router.get('/shared-with-me', authenticateToken, async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;

  try {
    const query = `
      SELECT sf.*, u.username as owner_username, m.title as music_title, v.title as video_title, fs.created_at as shared_at
      FROM file_shares fs
      JOIN shared_files sf ON fs.file_id = sf.id
      JOIN users u ON sf.owner_id = u.id
      LEFT JOIN music m ON sf.music_id = m.id 
      LEFT JOIN videos v ON sf.video_id = v.id 
      WHERE fs.shared_with_user_id = ?
      ORDER BY fs.created_at DESC LIMIT ? OFFSET ?
    `;

    const [files] = await db.execute(query, [req.user.id, parseInt(limit), parseInt(offset)]);

    res.json(files);
  } catch (error) {
    console.error('Erro ao listar arquivos compartilhados:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter arquivo por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [files] = await db.execute(
      `SELECT sf.*, u.username as owner_username, m.title as music_title, v.title as video_title
       FROM shared_files sf 
       JOIN users u ON sf.owner_id = u.id 
       LEFT JOIN music m ON sf.music_id = m.id 
       LEFT JOIN videos v ON sf.video_id = v.id 
       WHERE sf.id = ? AND (sf.owner_id = ? OR sf.is_public = TRUE OR EXISTS (
         SELECT 1 FROM file_shares WHERE file_id = sf.id AND shared_with_user_id = ?
       ))`,
      [req.params.id, req.user.id, req.user.id]
    );

    if (files.length === 0) {
      return res.status(404).json({ error: 'Arquivo não encontrado ou você não tem permissão para acessá-lo' });
    }

    res.json(files[0]);
  } catch (error) {
    console.error('Erro ao obter arquivo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar arquivo
router.post('/', authenticateToken, [
  body('filename').notEmpty().withMessage('Nome do arquivo é obrigatório'),
  body('original_name').notEmpty().withMessage('Nome original é obrigatório'),
  body('file_path').notEmpty().withMessage('Caminho do arquivo é obrigatório'),
  body('file_size').isInt({ min: 1 }).withMessage('Tamanho do arquivo deve ser um número positivo'),
  body('music_id').optional().isInt().withMessage('ID da música deve ser um número válido'),
  body('video_id').optional().isInt().withMessage('ID do vídeo deve ser um número válido')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { filename, original_name, file_path, file_size, mime_type, music_id, video_id, is_public } = req.body;

  try {
    // Verificar se música existe (se fornecida)
    if (music_id) {
      const [music] = await db.execute('SELECT id FROM music WHERE id = ?', [music_id]);
      if (music.length === 0) {
        return res.status(400).json({ error: 'Música não encontrada' });
      }
    }

    // Verificar se vídeo existe (se fornecido)
    if (video_id) {
      const [video] = await db.execute('SELECT id FROM videos WHERE id = ?', [video_id]);
      if (video.length === 0) {
        return res.status(400).json({ error: 'Vídeo não encontrado' });
      }
    }

    const [result] = await db.execute(
      'INSERT INTO shared_files (owner_id, filename, original_name, file_path, file_size, mime_type, music_id, video_id, is_public) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, filename, original_name, file_path, file_size, mime_type, music_id, video_id, is_public || false]
    );

    res.status(201).json({
      message: 'Arquivo criado com sucesso',
      fileId: result.insertId
    });
  } catch (error) {
    console.error('Erro ao criar arquivo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar arquivo
router.put('/:id', authenticateToken, [
  body('filename').optional().notEmpty().withMessage('Nome do arquivo não pode estar vazio'),
  body('original_name').optional().notEmpty().withMessage('Nome original não pode estar vazio'),
  body('music_id').optional().isInt().withMessage('ID da música deve ser um número válido'),
  body('video_id').optional().isInt().withMessage('ID do vídeo deve ser um número válido')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { filename, original_name, music_id, video_id, is_public } = req.body;

  try {
    // Verificar se o arquivo pertence ao usuário
    const [files] = await db.execute(
      'SELECT id FROM shared_files WHERE id = ? AND owner_id = ?',
      [req.params.id, req.user.id]
    );

    if (files.length === 0) {
      return res.status(404).json({ error: 'Arquivo não encontrado ou você não tem permissão para editá-lo' });
    }

    // Verificar se música existe (se fornecida)
    if (music_id) {
      const [music] = await db.execute('SELECT id FROM music WHERE id = ?', [music_id]);
      if (music.length === 0) {
        return res.status(400).json({ error: 'Música não encontrada' });
      }
    }

    // Verificar se vídeo existe (se fornecido)
    if (video_id) {
      const [video] = await db.execute('SELECT id FROM videos WHERE id = ?', [video_id]);
      if (video.length === 0) {
        return res.status(400).json({ error: 'Vídeo não encontrado' });
      }
    }

    const [result] = await db.execute(
      'UPDATE shared_files SET filename = ?, original_name = ?, music_id = ?, video_id = ?, is_public = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [filename, original_name, music_id, video_id, is_public, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    res.json({ message: 'Arquivo atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar arquivo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Eliminar arquivo
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Verificar se o arquivo pertence ao usuário
    const [files] = await db.execute(
      'SELECT file_path FROM shared_files WHERE id = ? AND owner_id = ?',
      [req.params.id, req.user.id]
    );

    if (files.length === 0) {
      return res.status(404).json({ error: 'Arquivo não encontrado ou você não tem permissão para eliminá-lo' });
    }

    // Iniciar transação para eliminar arquivo e compartilhamentos
    await db.execute('START TRANSACTION');

    try {
      // Eliminar compartilhamentos do arquivo
      await db.execute('DELETE FROM file_shares WHERE file_id = ?', [req.params.id]);

      // Eliminar o arquivo
      const [result] = await db.execute(
        'DELETE FROM shared_files WHERE id = ?',
        [req.params.id]
      );

      await db.execute('COMMIT');

      // Aqui você poderia adicionar lógica para eliminar o arquivo físico do sistema de arquivos
      // const fs = require('fs');
      // fs.unlinkSync(files[0].file_path);

      res.json({ message: 'Arquivo eliminado com sucesso' });
    } catch (error) {
      await db.execute('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Erro ao eliminar arquivo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Compartilhar arquivo com outro usuário
router.post('/:id/share', authenticateToken, [
  body('username').notEmpty().withMessage('Nome de usuário é obrigatório')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username } = req.body;

  try {
    // Verificar se o arquivo pertence ao usuário
    const [files] = await db.execute(
      'SELECT id FROM shared_files WHERE id = ? AND owner_id = ?',
      [req.params.id, req.user.id]
    );

    if (files.length === 0) {
      return res.status(404).json({ error: 'Arquivo não encontrado ou você não tem permissão para compartilhá-lo' });
    }

    // Verificar se o usuário existe
    const [users] = await db.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const sharedWithUserId = users[0].id;

    // Verificar se já não está compartilhado com este usuário
    const [existingShares] = await db.execute(
      'SELECT id FROM file_shares WHERE file_id = ? AND shared_with_user_id = ?',
      [req.params.id, sharedWithUserId]
    );

    if (existingShares.length > 0) {
      return res.status(400).json({ error: 'Arquivo já está compartilhado com este usuário' });
    }

    // Criar compartilhamento
    await db.execute(
      'INSERT INTO file_shares (file_id, shared_with_user_id, shared_by_user_id) VALUES (?, ?, ?)',
      [req.params.id, sharedWithUserId, req.user.id]
    );

    res.json({ message: 'Arquivo compartilhado com sucesso' });
  } catch (error) {
    console.error('Erro ao compartilhar arquivo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Remover compartilhamento
router.delete('/:id/share/:userId', authenticateToken, async (req, res) => {
  try {
    // Verificar se o arquivo pertence ao usuário
    const [files] = await db.execute(
      'SELECT id FROM shared_files WHERE id = ? AND owner_id = ?',
      [req.params.id, req.user.id]
    );

    if (files.length === 0) {
      return res.status(404).json({ error: 'Arquivo não encontrado ou você não tem permissão para gerenciar compartilhamentos' });
    }

    const [result] = await db.execute(
      'DELETE FROM file_shares WHERE file_id = ? AND shared_with_user_id = ?',
      [req.params.id, req.params.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Compartilhamento não encontrado' });
    }

    res.json({ message: 'Compartilhamento removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover compartilhamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar usuários com quem o arquivo está compartilhado
router.get('/:id/shares', authenticateToken, async (req, res) => {
  try {
    // Verificar se o arquivo pertence ao usuário
    const [files] = await db.execute(
      'SELECT id FROM shared_files WHERE id = ? AND owner_id = ?',
      [req.params.id, req.user.id]
    );

    if (files.length === 0) {
      return res.status(404).json({ error: 'Arquivo não encontrado ou você não tem permissão para ver compartilhamentos' });
    }

    const [shares] = await db.execute(
      `SELECT u.id, u.username, u.email, fs.created_at as shared_at
       FROM file_shares fs
       JOIN users u ON fs.shared_with_user_id = u.id
       WHERE fs.file_id = ?
       ORDER BY fs.created_at DESC`,
      [req.params.id]
    );

    res.json(shares);
  } catch (error) {
    console.error('Erro ao listar compartilhamentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;