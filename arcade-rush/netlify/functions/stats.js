const { openStore } = require('./_blobs');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  const key = (event.queryStringParameters?.key || 'visits').replace(/[^a-z0-9-]/gi, '');

  try {
    const store = openStore(context);
    let count = parseInt((await store.get(key)) || '0', 10) || 0;

    if (event.httpMethod === 'POST') {
      count += 1;
      await store.set(key, String(count));
    }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ value: count, key }),
    };
  } catch (err) {
    console.error('stats error:', err.message);
    return {
      statusCode: 503,
      headers: CORS,
      body: JSON.stringify({ value: null, key, error: 'stats_unavailable' }),
    };
  }
};