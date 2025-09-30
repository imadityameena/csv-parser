export async function fetchRecords(userEmail?: string) {
  const params = userEmail ? `?userEmail=${encodeURIComponent(userEmail)}` : '';
  const res = await fetch(`/api/records${params}`);
  if (!res.ok) throw new Error('Failed to fetch records');
  return res.json();
}

export async function createRecord(payload: { userEmail?: string; data: unknown }) {
  const res = await fetch('/api/records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create record');
  return res.json();
}

export async function deleteRecord(id: string) {
  const res = await fetch(`/api/records/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete record');
}

export async function getHealth() {
  const res = await fetch('/api/health');
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}



