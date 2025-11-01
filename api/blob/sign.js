export const config = { runtime: 'edge' };

function cors(origin='*'){
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export default async function handler(req) {
  const origin = req.headers.get('origin') || '*';

  if (req.method === 'OPTIONS')
    return new Response(null, { status: 204, headers: cors(origin) });

  if (req.method !== 'POST')
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'content-type': 'application/json', ...cors(origin) }
    });

  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return new Response(JSON.stringify({ error: 'Falta BLOB_READ_WRITE_TOKEN' }), {
        status: 500, headers: { 'content-type': 'application/json', ...cors(origin) }
      });
    }

    const r = await fetch('https://api.vercel.com/v2/blob/generate-upload-url', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });

    if (!r.ok) {
      const txt = await r.text();
      return new Response(JSON.stringify({ error: `sign ${r.status}`, detail: txt }), {
        status: r.status, headers: { 'content-type': 'application/json', ...cors(origin) }
      });
    }

    const { url, pathname } = await r.json();
    // ← claves redundantes para tu front:
    return new Response(JSON.stringify({ url, uploadUrl: url, pathname }), {
      status: 200, headers: { 'content-type': 'application/json', ...cors(origin) }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500, headers: { 'content-type': 'application/json', ...cors(origin) }
    });
  }
}
