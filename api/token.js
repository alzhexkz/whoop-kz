export const config = { runtime: 'edge' }

const WHOOP_API = "https://api.prod.whoop.com";

export default async function handler(req) {
  const url = new URL(req.url);
  const path = url.searchParams.get("path");

  // Token exchange
  if (!path) {
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
    const { code, redirect_uri } = await req.json();
    const params = new URLSearchParams({
      grant_type: "authorization_code", code, redirect_uri,
      client_id: process.env.WHOOP_CLIENT_ID,
      client_secret: process.env.WHOOP_CLIENT_SECRET,
    });
    const resp = await fetch(`${WHOOP_API}/oauth/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });
    const data = await resp.json();
    return new Response(JSON.stringify(data), { status: resp.status, headers: { "Content-Type": "application/json" } });
  }

  // API proxy
  const auth = req.headers.get("authorization");
  const resp = await fetch(`${WHOOP_API}/developer/v1${path}`, {
    headers: { Authorization: auth },
  });
  const data = await resp.json();
  return new Response(JSON.stringify(data), { status: resp.status, headers: { "Content-Type": "application/json" } });
}
