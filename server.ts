import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { testConnection } from './server/db.js';
import authRoutes from './server/routes/auth.js';
import apiRoutes from './server/routes/api.js';

dotenv.config();

async function startServer() {
  const app = express();
  // NOTA: El puerto 3000 es obligatorio en el entorno de AI Studio.
  // En tu VPS puedes cambiar la variable de entorno PORT=3001.
  const PORT = 3000;

  // Middlewares
  app.use(cors());
  app.use(express.json());

  // Probar conexión a BD
  await testConnection();

  // Rutas API (Fase 2)
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', database: 'mariadb' });
  });
  
  app.use('/api/auth', authRoutes);
  app.use('/api', apiRoutes);

  // Integración con Vite para desarrollo o estáticos en producción
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor Express corriendo en http://0.0.0.0:${PORT}`);
    console.log(`💡 Nota: En AI Studio, la app se sirve en el puerto 3000.`);
  });
}

startServer().catch(console.error);
