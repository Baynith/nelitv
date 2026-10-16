export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const response = await fetch('https://streamzone.fun/api/cdn-token');
    const data = await response.json();
    return res.status(200).json(data);
  } catch {
    return res.status(200).json({
      token: "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOiIxNzkyMTYyNjE2Iiwic2lwIjoiIiwicGF0aCI6IiIsInNlc3Npb25fY2RuX2lkIjoiNmVkYTlmNTZlMmE5YzU5MSIsInNlc3Npb25faWQiOiIiLCJjbGllbnRfaWQiOiI0ODQwODMyIiwiZGV2aWNlX2lkIjoiIiwibWF4X3Nlc3Npb25zIjowLCJzZXNzaW9uX2R1cmF0aW9uIjowLCJ1cmwiOiJodHRwczovLzEwMi4yMDguMjQ0LjkiLCJzZXNzaW9uX3RpbWVvdXQiOjAsImF1ZCI6IjciLCJzb3VyY2VzIjpbM119.6OD9tFE-CBnuqKrGEV6VAUTFZza2qzYTR16VpOaqtIfXzZ7hC9bjy0mZi-lLya8DiQHYohB2fF3IInSiLIPbEg==",
      cdnHost: "https://cdnedgch2.azamtvltd.co.tz",
      source: "live"
    });
  }
}
