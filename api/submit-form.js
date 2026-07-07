// Proxies form submissions to the Apps Script web app server-to-server,
// so the browser never has to read Apps Script's response directly.
// Apps Script's ContentService cannot emit Access-Control-Allow-Origin
// on the redirect it issues through script.googleusercontent.com, so a
// direct browser fetch() can never read the real success/error result.
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx6_S7flcEDnuC2J-DQTodt1iE9Y1Sl_6KQHGpgnl4jdCQpnZpGAb_DQPp8F52OVGDl/exec';

// Apps Script cold starts can take several seconds to spin up, so give it
// real headroom before giving up, one retry here would re-hit the same
// doPost and trip Code.gs's own 30s rate limiter on a submission that's
// still in flight.
const UPSTREAM_TIMEOUT_MS = 20000;

function fetchWithTimeout(body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  return fetch(SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: body,
    signal: controller.signal
  }).finally(() => clearTimeout(timer));
}

module.exports = async (request, response) => {
  if (request.method !== 'POST') {
    response.status(405).json({ result: 'error', message: 'Method not allowed' });
    return;
  }

  try {
    const body = typeof request.body === 'string' ? request.body : JSON.stringify(request.body);

    const upstream = await fetchWithTimeout(body);

    const raw = await upstream.text();
    let result;
    try {
      result = JSON.parse(raw);
    } catch (parseErr) {
      // Apps Script's own redirect (script.googleusercontent.com) can hand back
      // a non-JSON body even after doPost ran to completion, so a 2xx here still
      // means the submission went through, it's the response wrapper that's off.
      result = upstream.ok
        ? { result: 'success' }
        : { result: 'error', message: 'Unexpected response from form handler' };
    }

    response.status(200).json(result);
  } catch (err) {
    const timedOut = err && err.name === 'AbortError';
    response.status(502).json({
      result: 'error',
      code: timedOut ? 'TIMEOUT' : 'UNREACHABLE',
      message: timedOut ? 'Form handler took too long to respond' : 'Could not reach form handler'
    });
  }
};
