import jwt from 'jsonwebtoken';

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No autenticado' });

  try {
    const payload = jwt.verify(token, process.env.SESSION_SECRET);
    if (!payload.isAdmin) return res.status(403).json({ error: 'No tienes permisos de administrador' });
    req.activityUser = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Sesión inválida o caducada' });
  }
}
