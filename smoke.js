const fetch = (...args) => import('node-fetch').then(m => m.default(...args));

const BASE_URL = process.env.BASE_URL || 'https://sonar-edm-staging-ef96efd71e8e.herokuapp.com';
const COOKIE = process.env.SESSION_COOKIE || '';

async function check(path, opts = {}) {
  const url = BASE_URL + path;
  const start = Date.now();
  const res = await fetch(url, {
    headers: {
      'Cookie': COOKIE,
      'Accept': 'application/json'
    },
    ...opts
  });
  const ms = Date.now() - start;
  let bodyText = await res.text();
  let json;
  try { json = JSON.parse(bodyText); } catch {}
  const statusFlag = res.ok ? 'OK' : 'FAIL';
  console.log(`${statusFlag} ${res.status} ${path} (${ms}ms)`);
  if (json && (json.error || json.needsOnboarding || json.softOnboarding)) {
    console.log('  flags:', {
      error: json.error,
      needsOnboarding: json.needsOnboarding,
      softOnboarding: json.softOnboarding,
      cacheState: json.performance?.cacheState,
      rebuildQueued: json.performance?.rebuildQueued,
    });
  }
  if (!res.ok) {
    console.log('  body:', bodyText.slice(0, 500));
  }
  return { path, res, json, ms };
}

(async () => {
  if (!COOKIE) {
    console.warn('WARN: SESSION_COOKIE not set; authenticated endpoints may 401.');
  }
  const results = [];
  results.push(await check('/api/user/cached-dashboard-data'));
  results.push(await check('/api/location/reverse-geocode?lat=43.65&lon=-79.38'));
  results.push(await check('/api/events/cached-enhanced'));
  results.push(await check('/api/user/weekly-deltas'));
  const failures = results.filter(r => !r.res.ok && r.res.status !== 401);
  if (failures.length) {
    console.error('Some endpoint checks failed.');
    process.exitCode = 1;
  } else {
    console.log('All smoke checks passed (or unauthorized where expected).');
  }
})();
