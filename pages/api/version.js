// Simple version endpoint to verify deployed build
// Exposes short git SHA (if available at build time env) and startup timestamp.
// Fallbacks to 'unknown' if not provided.

export const config = { runtime: 'nodejs' };

let buildInfo = null;

function loadBuildInfo() {
  if (buildInfo) return buildInfo;
  const startedAt = new Date();
  const sha = process.env.GIT_COMMIT || process.env.HEROKU_SLUG_COMMIT || 'unknown';
  const shortSha = sha.substring(0, 7);
  buildInfo = {
    shortSha,
    fullSha: sha,
    startedAt: startedAt.toISOString(),
    note: 'Use this endpoint to confirm the frontend/API release version.'
  };
  return buildInfo;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const info = loadBuildInfo();
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json(info);
}
