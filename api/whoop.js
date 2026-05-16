export default async function handler(req, res) {
  try {
    const path = req.query.path || '';
    const token = req.query.token || '';

    console.log('Token:', token ? 'present' : 'MISSING');
    console.log('Original Path:', path);

 
    let actualPath = path;
    
    if (path.startsWith('/recovery')) {
      actualPath = '/user/measurement' + path;
    } else if (path.startsWith('/sleep')) {
      actualPath = '/user/measurement' + path;
    } else if (path.startsWith('/workout') || path.startsWith('/activity')) {
    
      actualPath = '/user/measurement' + path.replace('/activity', '/workout');
    } else if (path.startsWith('/cycle')) {
      actualPath = '/user' + path;
    } else if (path.startsWith('/profile') || path.startsWith('/user/profile')) {
      actualPath = '/user/profile/basic';
    }

    console.log('Corrected URL:', `https://api.prod.whoop.com/developer/v1${actualPath}`);

    const response = await fetch(
      `https://api.prod.whoop.com/developer/v1${actualPath}`,
      { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      }
    );

    console.log('WHOOP status:', response.status);
    
    const text = await response.text();
    
    res.setHeader('Content-Type', 'application/json');
    res.status(response.status).send(text);

  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: String(err) });
  }
}
