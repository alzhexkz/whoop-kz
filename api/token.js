export const config = { runtime: 'edge' }

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const body = await req.json();
  const { code, redirect_uri, refresh_token, grant_type } = body;

  const params = new URLSearchParams({
    grant_type: grant_type || "authorization_code",
    client_id: process.env.WHOOP_CLIENT_ID,
    client_secret: process.env.WHOOP_CLIENT_SECRET,
  });

  if (grant_type === "refresh_token") {
    params.set("refresh_token", refresh_token);
  } else {
    params.set("code", code);
    params.set("redirect_uri", redirect_uri);
  }

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
