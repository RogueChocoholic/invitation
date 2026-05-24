// /api/rsvp.js
// Handles POST requests to save RSVP submissions to rsvps.json

const fs = require('fs');
const path = require('path');

// Path to the shared JSON data file (at project root)
const DATA_FILE = path.join(process.cwd(), 'rsvps.json');

module.exports = async (req, res) => {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // CORS headers for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { name, attending, guests, message } = req.body;

    // Basic validation
    if (!name || typeof attending === 'undefined') {
      return res.status(400).json({ error: 'Name and attendance are required.' });
    }

    // Build new RSVP entry
    const entry = {
      name: String(name).trim(),
      attending: attending === true || attending === 'true' || attending === 'yes',
      guests: parseInt(guests, 10) || 1,
      message: String(message || '').trim(),
      timestamp: new Date().toISOString(),
    };

    // Read existing data
    let rsvps = [];
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      try {
        rsvps = JSON.parse(raw);
      } catch {
        rsvps = [];
      }
    }

    // Append and save
    rsvps.push(entry);
    fs.writeFileSync(DATA_FILE, JSON.stringify(rsvps, null, 2), 'utf8');

    return res.status(200).json({ success: true, message: 'RSVP saved successfully.' });
  } catch (err) {
    console.error('RSVP error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
