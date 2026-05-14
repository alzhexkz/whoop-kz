export default async function handler(req, res) {
  const path = req.query.path;
  const auth = req.headers['authorization'];

  if (!path) return res.status(400).json({ error: "Missing path" });
  if (!auth) return res.status(401).json({ error: "Missing auth" });

  try {
    const resp = await fetch(`https://api.prod.whoop.com/developer/v1${path}`, {
      headers: { Authorization: auth },
    });
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
