// Runtime: Edge (rápido, sin dependencias locales)
export const config = { runtime: 'edge' };

// Necesita la dep @vercel/blob (la agrega Vercel al build con package.json)
import { put } from '@vercel/blob';

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*', // si querés, después restringí a script.google.com
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
    // Nombre seguro: si te mandan ?filename=..., lo usamos; si no, generamos uno.
    const { searchParams } = new URL(req.url);
    const filename = (searchParams.get('filename') || `vianda-${Date.now()}`).replace(/[^\w.\-]/g, '_');

    const contentType = req.headers.get('content-type') || 'application/octet-stream';

    // Subimos DIRECTO desde el servidor a Vercel Blob
    // Requiere que el proyecto tenga configurado el store (Vercel agrega BLOB_READ_WRITE_TOKEN automáticamente)
    const blob = await put(filename, req.body, {
      access: 'public',
      addRandomSuffix: true,
      contentType,
      // Nota: no es necesario pasar el token a mano si está como env en el proyecto.
      // Si hiciera falta, se puede forzar con: token: process.env.BLOB_READ_WRITE_TOKEN
    });

    // Devolvemos la URL pública que tenés que guardar en la hoja (columna "Imagen")
    return new Response(JSON.stringify({ url: blob.url, pathname: blob.pathname, size: blob.size }), {
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
