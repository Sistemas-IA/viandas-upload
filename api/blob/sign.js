export const config = { runtime: 'edge' };

export default async function handler(req) {
  const origin = req.headers.get('origin') || '*';

  if (req.method === 'OPTIONS')
    return new Response(null, { status: 204, headers: cors(origin) });

  if (req.method !== 'POST')
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'content-type': 'application/json', ...cors(origin) },
    });

  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN; // ← env var del proyecto
    if (!token) throw new Error('Falta BLOB_READ_WRITE_TOKEN');

    const r = await fetch('https://api.vercel.com/v2/blob/generate-upload-url', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${token}`,          // ← IMPORTANTE
      },
      body: JSON.stringify({}),
    });

    if (!r.ok) {
      const txt = await r.text();
      throw new Error(`generate-upload-url ${r.status}: ${txt}`);
    }

    const { url, pathname } = await r.json();
    return new Response(JSON.stringify({ url, pathname }), {
      status: 200, headers: { 'content-type': 'application/json', ...cors(origin) },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500, headers: { 'content-type': 'application/json', ...cors(origin) },
    });
  }
}

function cors(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
