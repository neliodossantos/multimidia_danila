
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Registar utilizador
router.post('/register', [
  body('username').isLength({ min: 3 }).withMessage('Username deve ter pelo menos 3 caracteres'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Password deve ter pelo menos 6 caracteres'),
  body('firstName').notEmpty().withMessage('Primeiro nome é obrigatório'),
  body('lastName').notEmpty().withMessage('Último nome é obrigatório')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password, firstName, lastName } = req.body;

  try {
    // Verificar se o utilizador já existe
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Username ou email já existe' });
    }

    // Hash da password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Verificar se é o primeiro utilizador (será admin)
    const [userCount] = await db.execute('SELECT COUNT(*) as count FROM users');
    const isFirstUser = userCount[0].count === 0;

    // Inserir novo utilizador
    const [result] = await db.execute(
      'INSERT INTO users (username, email, password, first_name, last_name, is_editor, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, email, hashedPassword, firstName, lastName, isFirstUser, isFirstUser]
    );

    // Se for o primeiro utilizador, adicionar ao grupo público como owner
    if (isFirstUser) {
      await db.execute(
        'INSERT INTO group_members (group_id, user_id, is_owner, is_editor, status) VALUES (1, ?, TRUE, TRUE, "approved")',
        [result.insertId]
      );
    } else {
      // Adicionar utilizador ao grupo público como membro normal
      await db.execute(
        'INSERT INTO group_members (group_id, user_id, status) VALUES (1, ?, "approved")',
        [result.insertId]
      );
    }

    res.status(201).json({ 
      message: 'Utilizador registado com sucesso',
      isFirstUser 
    });
  } catch (error) {
    console.error('Erro no registo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Login
router.post('/login', [
  body('username').notEmpty().withMessage('Username é obrigatório'),
  body('password').notEmpty().withMessage('Password é obrigatória')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    const [users] = await db.execute(
      'SELECT id, username, email, password, first_name, last_name, is_editor, is_admin FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gerar JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Remover password da resposta
    delete user.password;

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Verificar token
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
