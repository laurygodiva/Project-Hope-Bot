import { Router } from 'express';
import { getCases } from '../../shared/sanctionsStore.js';

// Router aparte y no protegido con requireAdmin: cualquier miembro del
// servidor puede ver su propio historial de sanciones (y solo el suyo).
export function createSanctionsMineRouter() {
  const router = Router();

  router.get('/mine', (req, res) => {
    const cases = getCases().filter((c) => c.targetId === req.activityUser.userId);
    res.json(cases.slice(-100).reverse());
  });

  return router;
}
