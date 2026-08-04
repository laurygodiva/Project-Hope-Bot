import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../shared/logger.js';
import { isAdmin, isSanctionsManager, isFounder } from '../shared/permissions.js';

const DISCORD_API = 'https://discord.com/api/v10';
const TOKEN_TTL = '15m';

export function createActivityAuthRouter(client) {
  const router = Router();

  // Público (sin auth): solo expone el nombre/icono del servidor, dato ya
  // público en Discord, para pintar la pantalla de carga antes del login.
  router.get('/guild-icon', (req, res) => {
    const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID);
    if (!guild) return res.status(500).json({ error: 'Servidor de Discord no disponible' });
    res.json({ name: guild.name, iconURL: guild.iconURL({ size: 128 }) });
  });

  // La Activity (Embedded App SDK) obtiene un "code" de autorización dentro
  // del iframe de Discord y nos lo manda aquí para intercambiarlo por la
  // identidad real del usuario, sin pedirle que inicie sesión a mano.
  router.post('/token', async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Falta el código de autorización' });

    try {
      const tokenRes = await fetch(`${DISCORD_API}/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.DISCORD_CLIENT_ID,
          client_secret: process.env.DISCORD_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code,
        }),
      });

      if (!tokenRes.ok) {
        logger.error('activity-auth', `Fallo al intercambiar código: ${await tokenRes.text()}`);
        return res.status(401).json({ error: 'Código de autorización inválido' });
      }

      const tokenData = await tokenRes.json();

      const userRes = await fetch(`${DISCORD_API}/users/@me`, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (!userRes.ok) return res.status(401).json({ error: 'No se pudo obtener el usuario' });
      const user = await userRes.json();

      const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID);
      const member = guild ? await guild.members.fetch(user.id).catch(() => null) : null;
      const admin = member ? isAdmin(member) : false;
      const sanctionsManager = member ? isSanctionsManager(member) : false;
      const founder = member ? isFounder(member) : false;

      const sessionToken = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          avatar: user.avatar,
          isAdmin: admin,
          isSanctionsManager: sanctionsManager,
          isFounder: founder,
        },
        process.env.SESSION_SECRET,
        { expiresIn: TOKEN_TTL }
      );

      res.json({
        token: sessionToken,
        user: { id: user.id, username: user.username, avatar: user.avatar },
        isAdmin: admin,
        isSanctionsManager: sanctionsManager,
        isFounder: founder,
      });
    } catch (err) {
      logger.error('activity-auth', `Error verificando identidad: ${err.stack}`);
      res.status(500).json({ error: 'Error interno verificando identidad' });
    }
  });

  return router;
}
