export const config = { runtime: 'edge' };

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*', // luego podés restringir a script.google.com
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}
function jsonHeaders(origin) {
  return { 'content-type': 'application/json', ...corsHeaders(origin) };
}

export default async function handler(req) {
  const origin = req.headers.get('origin');

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
    // 1) Nombre opcional desde query: ?filename=...
    const { searchParams } = new URL(req.url);
    const filename = (searchParams.get('filename') || `vianda-${Date.now()}`).replace(/[^\w.\-]/g, '_');

    // 2) Pedimos URL firmada a la API de Vercel Blob
    //    Usamos el token RW del proyecto (Vercel lo crea al conectar Blob)
    const token = process.env.BLOB_READ_WRITE_TOKEN || '';
    const signRes = await fetch('https://api.vercel.com/v2/blob/generate-upload-url', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { 'authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({})
    });
    if (!signRes.ok) {
      const t = await signRes.text().catch(()=>'');
      return new Response(JSON.stringify({ error: `generate-upload-url ${signRes.status}`, detail: t }), {
        status: 500, headers: jsonHeaders(origin)
      });
    }
    const { url: uploadUrl, pathname } = await signRes.json();

    // 3) Devolvemos la URL firmada y el pathname sugerido
    return new Response(JSON.stringify({ uploadUrl, pathname, filename }), {
      status: 200,
      headers: jsonHeaders(origin),
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: jsonHeaders(origin),
    });
  }
}
