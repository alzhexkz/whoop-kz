export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { code, redirect_uri } = req.body;

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
  if (!resp.ok) return res.status(resp.status).json(data);
  res.status(200).json(data);
}
