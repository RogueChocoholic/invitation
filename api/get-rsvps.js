// /api/get-rsvps.js
// Returns all RSVP entries as JSON (admin protected by password check)

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(process.cwd(), 'rsvps.json');

// Simple admin password — change this before deploying!
const ADMIN_PASSWORD = 'wedding2025';

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
    if (!fs.existsSync(DATA_FILE)) {
      return res.status(200).json([]);
    }

    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    let rsvps = [];
    try {
      rsvps = JSON.parse(raw);
    } catch {
      rsvps = [];
    }

    return res.status(200).json(rsvps);
  } catch (err) {
    console.error('Get RSVPs error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
