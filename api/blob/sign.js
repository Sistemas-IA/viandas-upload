// Runtime: Edge (rápido y sin deps)
export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json', ...corsHeaders(req.headers.get('origin')) },
    });
  }

  try {
    // Pedir URL firmada a Vercel Blob (no requiere variables de entorno)
    const r = await fetch('https://api.vercel.com/v2/blob/generate-upload-url', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!r.ok) throw new Error(`generate-upload-url failed: ${r.status}`);
    const { url, pathname } = await r.json();

    return new Response(JSON.stringify({ url, pathname }), {
      status: 200,
      headers: { 'content-type': 'application/json', ...corsHeaders(req.headers.get('origin')) },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { 'content-type': 'application/json', ...corsHeaders(req.headers.get('origin')) },
    });
  }
}

function corsHeaders(origin) {
  // Para probar, abierto. Luego podés restringir a script.google.com / script.googleusercontent.com
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

