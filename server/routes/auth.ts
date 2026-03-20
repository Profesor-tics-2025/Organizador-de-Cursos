import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const [existing] = await pool.query<any[]>('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      res.status(400).json({ error: 'El email ya está registrado' });
      return;
    }
    const id = uuidv4();
    const hash = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)', [id, email, hash, name]);
    const token = jwt.sign({ id, email }, process.env.JWT_SECRET || 'tu_secreto_jwt_super_seguro_y_largo', { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any });
    res.json({ token, user: { id, email, name } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.socket.remoteAddress || '';
    const [users] = await pool.query<any[]>('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP, last_login_ip = ? WHERE id = ?', [ip, user.id]);
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'tu_secreto_jwt_super_seguro_y_largo', { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, username: user.username, avatarColor: user.avatar_color, language: user.language } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const [users] = await pool.query<any[]>(
      'SELECT id, email, name, username, phone, address, birthdate, country, timezone, avatar_color, language, last_login, last_login_ip, created_at FROM users WHERE id = ?',
      [req.user?.id]
    );
    if (users.length === 0) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }
    const u = users[0];
    res.json({ user: {
      id: u.id, email: u.email, name: u.name,
      username: u.username || '', phone: u.phone || '',
      address: u.address || '', birthdate: u.birthdate || '',
      country: u.country || 'España', timezone: u.timezone || 'Europe/Madrid',
      avatarColor: u.avatar_color || '#10b981', language: u.language || 'es',
      lastLogin: u.last_login || '', lastLoginIp: u.last_login_ip || '',
      createdAt: u.created_at || ''
    }});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

router.put('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, username, phone, address, birthdate, country, timezone, avatarColor, language } = req.body;
    await pool.query(
      'UPDATE users SET name=?, username=?, phone=?, address=?, birthdate=?, country=?, timezone=?, avatar_color=?, language=? WHERE id=?',
      [name, username || null, phone || null, address || null, birthdate || null, country || 'España', timezone || 'Europe/Madrid', avatarColor || '#10b981', language || 'es', req.user?.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error actualizando perfil' });
  }
});

router.put('/password', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
      return;
    }
    const [users] = await pool.query<any[]>('SELECT password_hash FROM users WHERE id = ?', [req.user?.id]);
    if (users.length === 0) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }
    const valid = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!valid) { res.status(401).json({ error: 'La contraseña actual no es correcta' }); return; }
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user?.id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error cambiando contraseña' });
  }
});

router.delete('/account', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.user?.id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error eliminando cuenta' });
  }
});

export default router;
