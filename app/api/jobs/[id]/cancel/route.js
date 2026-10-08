import { hasSession, ok, upstream } from '../../../../../vercel-functions/lib.js';
export async function POST(request,{params}) { if(!hasSession(request))return ok({error:'Unlock the finder first.'},401); const {id}=await params; if(!/^[\w-]+$/.test(id))return ok({error:'Invalid job id.'},400); return upstream(`/jobs/${encodeURIComponent(id)}/cancel`,'POST'); }
