// /api/export-csv.js
// Converts RSVP Firestore data to a downloadable CSV file

const { db } = require('./_firebase');

// Simple admin password — must match get-rsvps.js
const ADMIN_PASSWORD = 'wedding2025';

// Escape a CSV field (wrap in quotes if it contains commas, quotes, or newlines)
function csvEscape(value) {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Check admin password header
  const password = req.headers['x-admin-password'];
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const snapshot = await db.collection('rsvps').orderBy('timestamp', 'desc').get();
    const rsvps = [];
    
    snapshot.forEach(doc => {
      rsvps.push(doc.data());
    });

    // Build CSV string
    const header = 'Name,Attending,Message,Timestamp';
    const rows = rsvps.map(r =>
      [
        csvEscape(r.name),
        csvEscape(r.attending ? 'Yes' : 'No'),
        csvEscape(r.message),
        csvEscape(r.timestamp),
      ].join(',')
    );

    const csv = [header, ...rows].join('\r\n');

    // Return as a downloadable file
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="rsvps.csv"');
    return res.status(200).send(csv);
  } catch (err) {
    console.error('CSV export error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
