import { timingSafeEqual } from 'node:crypto';
import { ok, sessionCookie } from '../../../vercel-functions/lib.js';
export async function POST(request) {
  let password=''; try { password=(await request.json()).password||''; } catch {}
  if (typeof password !== 'string') return ok({error:'That password did not match.'},401);
  const expected=process.env.SITE_PASSWORD||''; const a=Buffer.from(password); const b=Buffer.from(expected);
  if(!expected||a.length!==b.length||!timingSafeEqual(a,b))return ok({error:'That password did not match.'},401);
  return new Response(JSON.stringify({unlocked:true}),{status:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store','Set-Cookie':sessionCookie(request)}});
}
