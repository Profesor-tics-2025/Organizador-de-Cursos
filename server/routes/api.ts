import { Router } from 'express';
import { pool } from '../db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.use(authenticateToken);

// --- COURSES ---
router.get('/courses', async (req: AuthRequest, res) => {
  try {
    const [rows] = await pool.query<any[]>('SELECT * FROM courses WHERE user_id = ? ORDER BY created_at DESC', [req.user?.id]);
    const mapped = rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      name: r.name,
      entity: r.entity,
      modality: r.modality,
      location: r.location,
      startDate: r.start_date,
      endDate: r.end_date,
      totalHours: r.total_hours,
      schedule: r.schedule,
      pricingType: r.pricing_type,
      price: r.price,
      status: r.status,
      color: r.color,
      createdAt: r.created_at
    }));
    res.json(mapped);
  } catch (e) { res.status(500).json({ error: 'Error fetching courses' }); }
});

router.post('/courses', async (req: AuthRequest, res) => {
  try {
    const id = uuidv4();
    const { name, entity, modality, location, startDate, endDate, totalHours, schedule, pricingType, price, status, color } = req.body;
    await pool.query(
      'INSERT INTO courses (id, user_id, name, entity, modality, location, start_date, end_date, total_hours, schedule, pricing_type, price, status, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, req.user?.id, name, entity, modality, location, startDate, endDate, totalHours, schedule, pricingType, price, status, color]
    );
    res.json({ id, ...req.body, userId: req.user?.id });
  } catch (e) { 
    console.error('Error in POST /courses:', e);
    res.status(500).json({ error: 'Error creating course' }); 
  }
});

router.put('/courses/:id', async (req: AuthRequest, res) => {
  try {
    const { name, entity, modality, location, startDate, endDate, totalHours, schedule, pricingType, price, status, color } = req.body;
    await pool.query(
      'UPDATE courses SET name=?, entity=?, modality=?, location=?, start_date=?, end_date=?, total_hours=?, schedule=?, pricing_type=?, price=?, status=?, color=? WHERE id=? AND user_id=?',
      [name, entity, modality, location, startDate, endDate, totalHours, schedule, pricingType, price, status, color, req.params.id, req.user?.id]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Error updating course' }); }
});

router.delete('/courses/:id', async (req: AuthRequest, res) => {
  try {
    await pool.query('DELETE FROM courses WHERE id=? AND user_id=?', [req.params.id, req.user?.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Error deleting course' }); }
});

// --- SESSIONS ---
router.get('/sessions', async (req: AuthRequest, res) => {
  try {
    const [rows] = await pool.query<any[]>('SELECT * FROM sessions WHERE user_id = ? ORDER BY date DESC', [req.user?.id]);
    const mapped = rows.map(r => ({
      id: r.id,
      courseId: r.course_id,
      userId: r.user_id,
      date: r.date,
      startTime: r.start_time,
      endTime: r.end_time,
      content: r.content,
      status: r.status,
      createdAt: r.created_at
    }));
    res.json(mapped);
  } catch (e) { res.status(500).json({ error: 'Error fetching sessions' }); }
});

router.post('/sessions', async (req: AuthRequest, res) => {
  try {
    const id = uuidv4();
    const { courseId, date, startTime, endTime, content, status } = req.body;
    await pool.query(
      'INSERT INTO sessions (id, course_id, user_id, date, start_time, end_time, content, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, courseId, req.user?.id, date, startTime, endTime, content, status || 'pendiente']
    );
    res.json({ id, ...req.body, userId: req.user?.id });
  } catch (e) { res.status(500).json({ error: 'Error creating session' }); }
});

router.delete('/sessions/:id', async (req: AuthRequest, res) => {
  try {
    await pool.query('DELETE FROM sessions WHERE id=? AND user_id=?', [req.params.id, req.user?.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Error deleting session' }); }
});

// --- CLIENTS ---
router.get('/clients', async (req: AuthRequest, res) => {
  try {
    const [rows] = await pool.query<any[]>('SELECT * FROM clients WHERE user_id = ? ORDER BY created_at DESC', [req.user?.id]);
    const mapped = rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      name: r.name,
      nif: r.nif,
      address: r.address,
      email: r.email,
      phone: r.phone,
      createdAt: r.created_at
    }));
    res.json(mapped);
  } catch (e) { res.status(500).json({ error: 'Error fetching clients' }); }
});

router.post('/clients', async (req: AuthRequest, res) => {
  try {
    const id = uuidv4();
    const { name, nif, address, email, phone } = req.body;
    await pool.query(
      'INSERT INTO clients (id, user_id, name, nif, address, email, phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, req.user?.id, name, nif, address, email, phone]
    );
    res.json({ id, ...req.body, userId: req.user?.id });
  } catch (e) { res.status(500).json({ error: 'Error creating client' }); }
});

router.put('/clients/:id', async (req: AuthRequest, res) => {
  try {
    const { name, nif, address, email, phone } = req.body;
    await pool.query(
      'UPDATE clients SET name=?, nif=?, address=?, email=?, phone=? WHERE id=? AND user_id=?',
      [name, nif, address, email, phone, req.params.id, req.user?.id]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Error updating client' }); }
});

router.delete('/clients/:id', async (req: AuthRequest, res) => {
  try {
    await pool.query('DELETE FROM clients WHERE id=? AND user_id=?', [req.params.id, req.user?.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Error deleting client' }); }
});

// --- SETTINGS ---
router.get('/settings', async (req: AuthRequest, res) => {
  try {
    const [rows] = await pool.query<any[]>('SELECT * FROM settings WHERE user_id = ?', [req.user?.id]);
    if (rows.length === 0) {
      res.json({ maxHoursPerWeek: 40, minHourlyRate: 0, availableDays: [], preferredModality: 'any', bankAccount: '' });
    } else {
      const settings = rows[0];
      if (typeof settings.available_days === 'string') {
        settings.availableDays = JSON.parse(settings.available_days);
      } else {
        settings.availableDays = settings.available_days || [];
      }
      res.json({
        maxHoursPerWeek: settings.max_hours_per_week,
        minHourlyRate: settings.min_hourly_rate,
        availableDays: settings.availableDays,
        preferredModality: settings.preferred_modality,
        bankAccount: settings.bank_account || ''
      });
    }
  } catch (e) { res.status(500).json({ error: 'Error fetching settings' }); }
});

router.put('/settings', async (req: AuthRequest, res) => {
  try {
    const { maxHoursPerWeek, minHourlyRate, availableDays, preferredModality, bankAccount } = req.body;
    const [existing] = await pool.query<any[]>('SELECT user_id FROM settings WHERE user_id = ?', [req.user?.id]);

    if (existing.length === 0) {
      await pool.query(
        'INSERT INTO settings (user_id, max_hours_per_week, min_hourly_rate, available_days, preferred_modality, bank_account) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user?.id, maxHoursPerWeek, minHourlyRate, JSON.stringify(availableDays), preferredModality, bankAccount || '']
      );
    } else {
      await pool.query(
        'UPDATE settings SET max_hours_per_week=?, min_hourly_rate=?, available_days=?, preferred_modality=?, bank_account=? WHERE user_id=?',
        [maxHoursPerWeek, minHourlyRate, JSON.stringify(availableDays), preferredModality, bankAccount || '', req.user?.id]
      );
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Error updating settings' }); }
});

export default router;
