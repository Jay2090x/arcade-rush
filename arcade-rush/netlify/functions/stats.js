const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

const NAMESPACE = 'arcade-rush';
const API = 'https://api.counterapi.dev/v1';

async function readCount(key) {
  const res = await fetch(`${API}/${NAMESPACE}/${key}/`);
  if (!res.ok) throw new Error(`read ${res.status}`);
  const data = await res.json();
  return data.count ?? 0;
}

async function bumpCount(key) {
  const res = await fetch(`${API}/${NAMESPACE}/${key}/up`);
  if (!res.ok) throw new Error(`bump ${res.status}`);
  const data = await res.json();
  return data.count ?? 0;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  const key = (event.queryStringParameters?.key || 'visits').replace(/[^a-z0-9-]/gi, '');

  try {
    let count = await readCount(key);
    if (event.httpMethod === 'POST') {
      count = await bumpCount(key);
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