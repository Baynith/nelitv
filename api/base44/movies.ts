export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const limit = req.query.limit || 50;
  const skip = req.query.skip || 0;
  const url = `https://neliplay-studio-copy-d25bc59a.base44.app/api/entities/Movie?limit=${limit}&skip=${skip}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(200).json([]);
  }
}
