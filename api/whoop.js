export const config = { runtime: 'edge' }

export default async function handler(req) {
  const url = new URL(req.url);
  const path = url.searchParams.get("path");
  const auth = req.headers.get("authorization");
  
  const resp = await fetch(`https://api.prod.whoop.com/developer/v1${path}`, {
    headers: { Authorization: auth },
  });
  const data = await resp.json();
  return new Response(JSON.stringify(data), {
    status: resp.status,
    headers: { "Content-Type": "application/json" },
  });
}
