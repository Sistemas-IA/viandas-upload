export const config = { runtime: 'edge' };

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
function jsonHeaders(origin) {
  return { 'content-type': 'application/json', ...corsHeaders(origin) };
}

export default async function handler(req) {
  const origin = req.headers.get('origin');

  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: jsonHeaders(origin),
    });
  }

  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing BLOB_READ_WRITE_TOKEN' }), {
        status: 500,
        headers: jsonHeaders(origin),
      });
    }

    const contentType = req.headers.get('content-type') || 'application/octet-stream';
    const body = await req.arrayBuffer();

    const resp = await fetch('https://api.vercel.com/v2/blob/upload', {
      method: 'POST',
      headers: {
        'x-blob-token': token,       // ← Token de Blob (RW), NO tu token personal de Vercel
        'content-type': contentType,
      },
      body,
    });

    const jr = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: 'upstream', detail: jr }), {
        status: 502,
        headers: jsonHeaders(origin),
      });
    }

    return new Response(JSON.stringify({ url: jr.url, pathname: jr.pathname }), {
      status: 200,
      headers: jsonHeaders(origin),
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e && e.message || e) }), {
      status: 500,
      headers: jsonHeaders(origin),
    });
  }
}
