// instagram.service.js
// Minimal helper to fetch recent posts for a username using Instagram Graph API
// This is a scaffold: proper production use requires a Business/Creator account,
// an App, and long-lived access tokens.

const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const INSTAGRAM_USER_ID = process.env.INSTAGRAM_USER_ID; // for Graph API calls

async function getFetch() {
  if (typeof globalThis.fetch === 'function') return globalThis.fetch.bind(globalThis);
  try {
    const nodeFetch = await import('node-fetch');
    return nodeFetch.default || nodeFetch;
  } catch (err) {
    throw new Error('No fetch available. Install node-fetch or run on Node 18+.');
  }
}

async function fetchPosts({ username, count = 8 } = {}) {
  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_USER_ID) {
    throw new Error('Instagram integration not configured. Set INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_USER_ID in server environment.');
  }

  const mediaUrl = `https://graph.instagram.com/${INSTAGRAM_USER_ID}/media?fields=id,caption,media_type,media_url,timestamp,permalink&limit=${count}&access_token=${INSTAGRAM_ACCESS_TOKEN}`;

  const _fetch = await getFetch();
  const res = await _fetch(mediaUrl);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Instagram API error: ${res.status} ${text}`);
  }

  const json = await res.json();
  const items = (json.data || []).slice(0, count).map(item => ({
    id: item.id,
    image: item.media_url || '',
    caption: item.caption || '',
    date: item.timestamp || '',
    permalink: item.permalink || '',
    likes: '',
    comments: '',
    tags: [],
  }));

  return items;
}

export default { fetchPosts };
