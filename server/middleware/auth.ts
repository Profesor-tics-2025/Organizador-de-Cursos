import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET || 'tu_secreto_jwt_super_seguro_y_largo', (err, user) => {
    if (err) {
      res.status(403).json({ error: 'Token inválido o expirado.' });
      return;
    }
    req.user = user as { id: string; email: string };
    next();
  });
};
