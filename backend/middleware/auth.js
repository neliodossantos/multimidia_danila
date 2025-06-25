const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar se o utilizador ainda existe
    const [users] = await db.execute(
      'SELECT id, username, email, is_editor, is_admin FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Utilizador não encontrado' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

const requireEditor = (req, res, next) => {
  if (!req.user.is_editor && !req.user.is_admin) {
    return res.status(403).json({ error: 'Privilégios de editor requeridos' });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ error: 'Privilégios de administrador requeridos' });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireEditor,
  requireAdmin
};
