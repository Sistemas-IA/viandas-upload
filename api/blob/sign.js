export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors('*') });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'content-type': 'application/json', ...cors('*') } });

  const token = process.env.BLOB_READ_WRITE_TOKEN;          // <- lee la env var
  if (!token) return new Response(JSON.stringify({ error: 'Falta BLOB_READ_WRITE_TOKEN' }), { status: 500, headers: { 'content-type': 'application/json', ...cors('*') } });

  const r = await fetch('https://api.vercel.com/v2/blob/generate-upload-url', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'authorization': `Bearer ${token}` }, // <- IMPORTANTE
    body: JSON.stringify({}),
  });

  if (!r.ok) return new Response(JSON.stringify({ error: `sign ${r.status}` }), { status: r.status, headers: { 'content-type': 'application/json', ...cors('*') } });

  const { url, pathname } = await r.json();
  return new Response(JSON.stringify({ url, pathname }), { status: 200, headers: { 'content-type': 'application/json', ...cors('*') } });
}

function cors(origin){ return { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' }; }
