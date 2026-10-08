import { ok, passwordMatches, sessionCookie, upstream } from '../../../vercel-functions/lib.js';

export const runtime = 'nodejs';

export async function POST(request) {
  if (!process.env.SITE_PASSWORD || !process.env.AGENT_URL || !process.env.AGENT_SECRET) {
    return ok({error:'Opportunity finder is not configured.'},503);
  }
  let data;
  try { data = await request.json(); }
  catch { return ok({error:'Enter your site password to start a search.'},400); }
  if (!passwordMatches(data?.password)) return ok({error:'That password did not match.'},401);

  const response = await upstream('/jobs','POST');
  if (response.ok) response.headers.set('Set-Cookie',sessionCookie(request));
  return response;
}
