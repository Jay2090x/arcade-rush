const { getStore } = require('@netlify/blobs');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  const key = (event.queryStringParameters?.key || 'visits').replace(/[^a-z0-9-]/gi, '');
  const store = getStore('arcade-rush-stats');

  let count = parseInt((await store.get(key)) || '0', 10) || 0;

  if (event.httpMethod === 'POST') {
    count += 1;
    await store.set(key, String(count));
  }

  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({ value: count }),
  };
};