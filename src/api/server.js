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

  app.use('/api/activity', createActivityAuthRouter(client));
  app.use('/api/guild', requireAdmin, createGuildRouter(client));

  app.get('/api/health', (req, res) => res.json({ ok: true }));

  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    logger.success('api', `Servidor Express escuchando en el puerto ${port}`);
  });

  return app;
}
