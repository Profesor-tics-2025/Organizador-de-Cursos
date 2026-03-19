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
    const [users] = await pool.query<any[]>('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];
    
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'tu_secreto_jwt_super_seguro_y_largo', { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const [users] = await pool.query<any[]>('SELECT id, email, name FROM users WHERE id = ?', [req.user?.id]);
    if (users.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    res.json({ user: users[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

export default router;
