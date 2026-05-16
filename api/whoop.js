export default async function handler(req, res) {
  try {
    const path = req.query.path || '';
    // Пробуем разные варианты получения токена
    const auth = req.headers['authorization'] 
      || req.headers['Authorization']
      || '';

    console.log('Auth header:', auth ? 'present' : 'MISSING');
    console.log('Path:', path);

    const response = await fetch(
      `https://api.prod.whoop.com/developer/v1${path}`,
      { headers: { 'Authorization': auth } }
    );

    console.log('WHOOP status:', response.status);
    const text = await response.text();
    console.log('WHOOP response:', text.substring(0, 200));
    
    res.setHeader('Content-Type', 'application/json');
    res.status(response.status).send(text);
  } catch (err) {
    console.log('Error:', err.message);
    res.status(500).json({ error: String(err) });
  }
}
