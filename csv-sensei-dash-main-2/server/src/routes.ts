import { Router } from 'express';
import { RecordModel } from './models/Record';

export const router = Router();

router.get('/health', async (_req, res) => {
  const ok = !!(await RecordModel.db?.readyState);
  res.json({ ok });
});

// AI endpoints replacing former Supabase functions
router.post('/ai/analyze-csv-schema', async (req, res) => {
  const { csvHeaders, selectedIndustry, validationErrors } = req.body ?? {};
  if (!Array.isArray(csvHeaders)) return res.status(400).json({ error: 'csvHeaders required' });
  // Placeholder logic: echo a trivial mapping and allow proceed
  const mappings: Record<string, string> = {};
  for (const header of csvHeaders) mappings[header] = header;
  const response = {
    canProceed: true,
    mappings,
    transformations: [],
    reasoning: `Auto-mapped ${csvHeaders.length} fields for ${selectedIndustry || 'general'} dataset. ${
      validationErrors?.length ? `Found ${validationErrors.length} validation issues.` : 'No validation issues detected.'
    }`,
    confidence: 0.85,
  };
  res.json(response);
});

router.post('/ai/generate-business-insights', async (req, res) => {
  const { data } = req.body ?? {};
  if (!Array.isArray(data)) return res.status(400).json({ error: 'data array required' });
  const response = {
    insights: [
      { title: 'Steady Growth', description: 'Data suggests steady upward trend.', metric: 'growth', confidence: 0.82 },
      { title: 'Outliers Detected', description: 'Some rows deviate significantly.', metric: 'quality', confidence: 0.67 },
    ],
  };
  res.json(response);
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


