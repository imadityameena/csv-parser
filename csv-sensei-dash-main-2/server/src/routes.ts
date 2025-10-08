import { Router } from 'express';
import { RecordModel } from './models/Record';

export const router = Router();

router.get('/health', async (_req, res) => {
  const ok = !!(await RecordModel.db?.readyState);
  res.json({ ok });
});

router.get('/records', async (req, res) => {
  const userEmail = String(req.query.userEmail || '');
  const q = userEmail ? { userEmail } : {};
  const items = await RecordModel.find(q).sort({ createdAt: -1 }).lean();
  res.json(items);
});

router.post('/records', async (req, res) => {
  const { userEmail, data } = req.body ?? {};
  if (!data) return res.status(400).json({ error: 'data required' });
  const doc = await RecordModel.create({ userEmail, data });
  res.status(201).json(doc);
});

router.delete('/records/:id', async (req, res) => {
  await RecordModel.findByIdAndDelete(req.params.id);
  res.status(204).end();
});



