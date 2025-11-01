export const config = { runtime: 'edge' }; // rápido y sin servidor dedicado

import { put } from '@vercel/blob';

function cors(origin='*'){
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}

export default async function handler(req) {
  const origin = req.headers.get('origin') || '*';

  if (req.method === 'OPTIONS')
    return new Response(null, { status: 204, headers: cors(origin) });

  if (req.method !== 'POST')
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'content-type':'application/json', ...cors(origin) }
    });

  try {
    // Leemos el archivo crudo que manda tu front
    const contentType = req.headers.get('content-type') || 'application/octet-stream';
    const buf = await req.arrayBuffer();
    if (!buf || buf.byteLength === 0)
      return new Response(JSON.stringify({ error: 'Archivo vacío' }), {
        status: 400, headers: { 'content-type':'application/json', ...cors(origin) }
      });

    // Nombre simple
    const ext = (contentType.split('/')[1] || 'bin').replace(/[^a-z0-9]/gi,'').toLowerCase();
    const filename = `viandas/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // Subir a Blob (acceso público)
    const blob = await put(filename, buf, { access: 'public', contentType });

    // Devolver URL pública
    return new Response(JSON.stringify({ ok:true, url: blob.url }), {
      status: 200, headers: { 'content-type':'application/json', ...cors(origin) }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500, headers: { 'content-type':'application/json', ...cors(origin) }
    });
  }
}
