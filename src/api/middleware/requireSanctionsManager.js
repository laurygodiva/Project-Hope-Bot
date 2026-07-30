export function requireSanctionsManager(req, res, next) {
  if (!req.activityUser?.isSanctionsManager) {
    return res.status(403).json({ error: 'No tienes permisos para gestionar este apartado de sanciones' });
  }
  next();
}
