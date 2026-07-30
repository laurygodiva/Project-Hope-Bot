import express from 'express';
import cors from 'cors';
import { createActivityAuthRouter } from './activityAuth.js';
import { createGuildRouter } from './routes/guild.js';
import { requireAdmin } from './middleware/requireAdmin.js';
import { logger } from '../shared/logger.js';

export function startServer(client) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Montadas dos veces a propósito: el proxy de Discord Activities quita el
  // prefijo "/api" antes de reenviar la petición a este backend, pero el
  // proxy de Vite en desarrollo local NO lo quita. Así funciona en ambos casos.
  const activityAuthRouter = createActivityAuthRouter(client);
  const guildRouter = createGuildRouter(client);

  app.use('/api/activity', activityAuthRouter);
  app.use('/activity', activityAuthRouter);
  app.use('/api/guild', requireAdmin, guildRouter);
  app.use('/guild', requireAdmin, guildRouter);

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.get('/health', (req, res) => res.json({ ok: true }));

  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    logger.success('api', `Servidor Express escuchando en el puerto ${port}`);
  });

  return app;
}
