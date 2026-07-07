// Proxies form submissions to the Apps Script web app server-to-server,
// so the browser never has to read Apps Script's response directly.
// Apps Script's ContentService cannot emit Access-Control-Allow-Origin
// on the redirect it issues through script.googleusercontent.com, so a
// direct browser fetch() can never read the real success/error result.
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx6_S7flcEDnuC2J-DQTodt1iE9Y1Sl_6KQHGpgnl4jdCQpnZpGAb_DQPp8F52OVGDl/exec';

module.exports = async (request, response) => {
  if (request.method !== 'POST') {
    response.status(405).json({ result: 'error', message: 'Method not allowed' });
    return;
  }

  try {
    const body = typeof request.body === 'string' ? request.body : JSON.stringify(request.body);

    const upstream = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: body
    });

    const raw = await upstream.text();
    let result;
    try {
      result = JSON.parse(raw);
    } catch (parseErr) {
      result = { result: 'error', message: 'Unexpected response from form handler' };
    }

    response.status(200).json(result);
  } catch (err) {
    response.status(502).json({ result: 'error', message: 'Could not reach form handler' });
  }
};
