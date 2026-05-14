export const config = {
  runtime: 'edge',
}

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { code, redirect_uri } = await req.json();

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri,
    client_id: process.env.WHOOP_CLIENT_ID,
    client_secret: process.env.WHOOP_CLIENT_SECRET,
  });

  const resp = await fetch("https://api.prod.whoop.com/oauth/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  const data = await resp.json();
  return new Response(JSON.stringify(data), {
    status: resp.status,
    headers: { "Content-Type": "application/json" },
  });
}
