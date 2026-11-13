export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return api(request, env, url);
    if (url.pathname.startsWith('/images/')) {
      const key = decodeURIComponent(url.pathname.slice('/images/'.length));
      const obj = await env.IMAGES.get(key);
      if (!obj) return new Response('Not found', { status: 404 });
      return new Response(obj.body, { headers: { 'Content-Type': obj.httpMetadata?.contentType || 'image/jpeg', 'Cache-Control': 'public, max-age=31536000' } });
    }
    return env.ASSETS.fetch(request);
  },
  async scheduled(event, env, ctx) {
    // Daily server-side hook reserved for push/email notifications.
    // The dashboard also shows due notifications immediately when opened.
    ctx.waitUntil(checkExpiring(env));
  }
};

async function api(request, env, url) {
  try {
    if (request.method === 'GET' && url.pathname === '/api/products') {
      const { results } = await env.DB.prepare('SELECT * FROM products ORDER BY expiry_date ASC, name ASC').all();
      return json(results);
    }
    if (request.method === 'GET' && url.pathname.startsWith('/api/products/barcode/')) {
      const barcode = decodeURIComponent(url.pathname.split('/').pop());
      const row = await env.DB.prepare('SELECT * FROM products WHERE barcode = ? ORDER BY expiry_date ASC LIMIT 1').bind(barcode).first();
      return json(row || null);
    }
    if (request.method === 'POST' && url.pathname === '/api/products') {
      const body = await request.json();
      if (!body.name || !body.expiry_date) return json({ error: 'الاسم وتاريخ الانتهاء مطلوبان' }, 400);
      const result = await env.DB.prepare(`INSERT INTO products (name, barcode, quantity, expiry_date, image_key, notes) VALUES (?, ?, ?, ?, ?, ?)`)
        .bind(body.name, body.barcode || null, Number(body.quantity || 0), body.expiry_date, body.image_key || null, body.notes || null).run();
      return json({ id: result.meta.last_row_id });
    }
    if (request.method === 'PUT' && url.pathname.startsWith('/api/products/')) {
      const id = Number(url.pathname.split('/').pop());
      const body = await request.json();
      await env.DB.prepare(`UPDATE products SET name=?, barcode=?, quantity=?, expiry_date=?, image_key=?, notes=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`)
        .bind(body.name, body.barcode || null, Number(body.quantity || 0), body.expiry_date, body.image_key || null, body.notes || null, id).run();
      return json({ ok: true });
    }
    if (request.method === 'DELETE' && url.pathname.startsWith('/api/products/')) {
      const id = Number(url.pathname.split('/').pop());
      const row = await env.DB.prepare('SELECT image_key FROM products WHERE id=?').bind(id).first();
      await env.DB.prepare('DELETE FROM products WHERE id=?').bind(id).run();
      if (row?.image_key) await env.IMAGES.delete(row.image_key);
      return json({ ok: true });
    }
    if (request.method === 'POST' && url.pathname === '/api/images') {
      const form = await request.formData();
      const file = form.get('image');
      if (!(file instanceof File)) return json({ error: 'صورة غير موجودة' }, 400);
      const key = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      await env.IMAGES.put(key, file.stream(), { httpMetadata: { contentType: file.type || 'image/jpeg' } });
      return json({ key, url: `/images/${encodeURIComponent(key)}` });
    }
    return json({ error: 'Not found' }, 404);
  } catch (e) { return json({ error: e.message || 'Server error' }, 500); }
}

async function checkExpiring(env) {
  const today = new Date();
  const in5 = new Date(today); in5.setDate(today.getDate() + 5);
  const a = today.toISOString().slice(0,10), b = in5.toISOString().slice(0,10);
  await env.DB.prepare('SELECT COUNT(*) AS count FROM products WHERE expiry_date BETWEEN ? AND ?').bind(a,b).first();
}
function json(data, status=200) { return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' } }); }
