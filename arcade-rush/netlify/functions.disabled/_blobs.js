const { getStore, connectLambda } = require('@netlify/blobs');

const STORE_NAME = 'arcade-rush-stats';

function openStore(context, event) {
  if (event?.blobs) {
    connectLambda(event);
  }
  const siteID = context?.site?.id || process.env.SITE_ID || process.env.NETLIFY_SITE_ID;
  const token = context?.netlify?.token || process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_PAT;
  if (siteID && token) {
    return getStore({ name: STORE_NAME, siteID, token });
  }
  return getStore(STORE_NAME);
}

module.exports = { openStore, STORE_NAME };