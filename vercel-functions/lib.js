import { createHmac, timingSafeEqual } from 'node:crypto';

const cookieName = 'opp_session';
function secret() { const value=process.env.AGENT_SECRET; if(!value) throw new Error('Not configured'); return value; }
function sign(data) { return createHmac('sha256',secret()).update(data).digest('base64url'); }
function cookieValue(request) { return (request.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(`${cookieName}=`))?.slice(cookieName.length+1)||''; }
export function hasSession(request) {
  try { const token=cookieValue(request); const [payload,sig]=token.split('.'); if(!payload||!sig) return false; const expected=Buffer.from(sign(payload)); const actual=Buffer.from(sig); if(expected.length!==actual.length||!timingSafeEqual(expected,actual))return false; const data=JSON.parse(Buffer.from(payload,'base64url').toString()); return data.exp>Date.now(); } catch { return false; }
}
export function sessionCookie(request) {
  const payload=Buffer.from(JSON.stringify({exp:Date.now()+12*60*60_000})).toString('base64url');
  const secure = !request || new URL(request.url).protocol === 'https:';
  return `${cookieName}=${payload}.${sign(payload)}; HttpOnly;${secure ? ' Secure;' : ''} SameSite=Strict; Path=/api; Max-Age=43200`;
}
export function passwordMatches(password) {
  const expected = process.env.SITE_PASSWORD;
  if (typeof password !== 'string' || !expected) return false;
  const actualBytes = Buffer.from(password);
  const expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}
export function ok(data,status=200) { return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}}); }
export async function upstream(path,method='GET') {
  const base=process.env.AGENT_URL;
  if(!base || !process.env.AGENT_SECRET) return ok({error:'Opportunity finder is not configured.'},503);
  try {
    const response=await fetch(new URL(path,base),{
      method,
      headers:{'x-agent-secret':secret(),'content-type':'application/json'},
      ...(method==='POST'?{body:'{}'}:{}),
      cache:'no-store',
      signal:AbortSignal.timeout(10_000),
    });
    let data;
    try { data = await response.json(); }
    catch { return ok({error:'The agent returned an unreadable response. Please try again.'},502); }
    if (!response.ok) {
      const message = response.status === 404 ? 'This search is no longer available. Refresh to start another.'
        : response.status === 401 ? 'The site could not authenticate with the agent.'
        : 'The agent could not complete this request. Please try again.';
      return ok({error:message},response.status === 401 ? 502 : response.status);
    }
    return ok(data,response.status);
  } catch (error) {
    const timedOut = error.name === 'TimeoutError' || error.name === 'AbortError';
    return ok({error:timedOut ? 'The agent took too long to respond. Please try again.' : 'The agent could not be reached. Check that it is running and try again.'},timedOut ? 504 : 502);
  }
}
