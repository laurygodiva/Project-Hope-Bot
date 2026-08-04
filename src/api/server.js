import express from 'express';
import cors from 'cors';
import { createActivityAuthRouter } from './activityAuth.js';
import { createGuildRouter } from './routes/guild.js';
import { createSanctionsRouter } from './routes/sanctions.js';
import { createSanctionsMineRouter } from './routes/sanctionsMine.js';
import { createTicketsRouter } from './routes/tickets.js';
import { requireAdmin } from './middleware/requireAdmin.js';
import { requireGuildMember } from './middleware/requireGuildMember.js';
import { logger } from '../shared/logger.js';

export function startServer(client) {
  const app = express();

  app.set('etag', false);
  app.use(cors());
  app.use(express.json());
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  // Montadas dos veces a propósito: el proxy de Discord Activities quita el
  // prefijo "/api" antes de reenviar la petición a este backend, pero el
  // proxy de Vite en desarrollo local NO lo quita. Así funciona en ambos casos.
  const activityAuthRouter = createActivityAuthRouter(client);
  const guildRouter = createGuildRouter(client);
  const sanctionsRouter = createSanctionsRouter(client);
  const sanctionsMineRouter = createSanctionsMineRouter();
  const ticketsRouter = createTicketsRouter(client);

  app.use('/api/activity', activityAuthRouter);
  app.use('/activity', activityAuthRouter);
  app.use('/api/guild', requireAdmin, guildRouter);
  app.use('/guild', requireAdmin, guildRouter);
  // El de "mine" va antes y sin requireAdmin: solo registra la ruta /mine, así
  // que cualquier otra ruta de /sanctions cae al router de abajo (admin-gated).
  app.use('/api/sanctions', requireGuildMember, sanctionsMineRouter);
  app.use('/sanctions', requireGuildMember, sanctionsMineRouter);
  app.use('/api/sanctions', requireAdmin, sanctionsRouter);
  app.use('/sanctions', requireAdmin, sanctionsRouter);
  app.use('/api/tickets', requireGuildMember, ticketsRouter);
  app.use('/tickets', requireGuildMember, ticketsRouter);

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.get('/health', (req, res) => res.json({ ok: true }));

  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    logger.success('api', `Servidor Express escuchando en el puerto ${port}`);
  });

  return app;
}
