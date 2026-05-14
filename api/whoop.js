export const config = { runtime: 'edge' }

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get("path");
    const auth = req.headers.get("authorization");

    if (!path) return new Response("Missing path", { status: 400 });
    if (!auth) return new Response("Missing auth", { status: 401 });

    const resp = await fetch(`https://api.prod.whoop.com/developer/v1${path}`, {
      headers: { 
        Authorization: auth,
        "Content-Type": "application/json",
      },
    });

    const text = await resp.text();
    return new Response(text, {
      status: resp.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
