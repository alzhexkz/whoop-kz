export default async function handler(req, res) {
  try {
    const path = req.query.path || '';
    const token = req.query.token || '';

    console.log('Token:', token ? 'present' : 'MISSING');
    console.log('Path:', path);

    const response = await fetch(
      `https://api.prod.whoop.com/developer/v1${path}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    console.log('WHOOP status:', response.status);
    const text = await response.text();
    res.setHeader('Content-Type', 'application/json');
    res.status(response.status).send(text);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
