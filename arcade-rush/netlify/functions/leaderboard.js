const { openStore } = require('./_blobs');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

const MAX = 25;

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  const game = (event.queryStringParameters?.game || 'vatreni-bro').replace(/[^a-z0-9-]/gi, '');
  const mode = (event.queryStringParameters?.mode || 'all').replace(/[^a-z]/gi, '');
  const key = `lb-${game}`;

  try {
    const store = openStore(context);
    let entries = [];
    try {
      entries = JSON.parse((await store.get(key)) || '[]');
    } catch (_) {
      entries = [];
    }

    if (event.httpMethod === 'POST') {
      try {
        const body = JSON.parse(event.body || '{}');
        const score = parseInt(body.score, 10) || 0;
        if (score > 0) {
          entries.push({
            score,
            combo: parseInt(body.combo, 10) || 0,
            mode: (body.mode || 'classic').slice(0, 12),
            name: String(body.name || 'Bro').slice(0, 16),
            ts: body.ts || Date.now(),
          });
          entries.sort((a, b) => b.score - a.score);
          entries = entries.slice(0, MAX);
          await store.set(key, JSON.stringify(entries));
        }
      } catch (_) {}
    }

    let out = entries;
    if (mode !== 'all') out = entries.filter(e => e.mode === mode);

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ entries: out.slice(0, 10) }),
    };
  } catch (err) {
    console.error('leaderboard error:', err.message);
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ entries: [] }),
    };
  }
};