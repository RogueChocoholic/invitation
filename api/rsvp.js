// /api/rsvp.js
// Handles POST requests to save RSVP submissions to Firestore

const { db } = require('./_firebase');

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
    const { name, attending, message } = req.body;

    // Basic validation
    if (!name || typeof attending === 'undefined') {
      return res.status(400).json({ error: 'Name and attendance are required.' });
    }

    // Build new RSVP entry
    const entry = {
      name: String(name).trim(),
      attending: attending === true || attending === 'true' || attending === 'yes',
      message: String(message || '').trim(),
      timestamp: new Date().toISOString(),
    };

    // Save to Firestore
    await db.collection('rsvps').add(entry);

    return res.status(200).json({ success: true, message: 'RSVP saved successfully.' });
  } catch (err) {
    console.error('RSVP error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
