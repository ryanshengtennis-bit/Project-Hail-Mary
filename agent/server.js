import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { isIP } from 'node:net';
import dns from 'node:dns/promises';
import { Agent, run, tool } from '@openai/agents';
import OpenAI from 'openai';
import { z } from 'zod';

const PORT = Number(process.env.PORT || 8080);
const JOB_LIMIT_MS = 4 * 60_000;
const MAX_SEARCHES = 10;
const MAX_READS = 15;
const PROFILE_PATH = new URL('./interests.txt', import.meta.url);
const jobs = new Map();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function urlKey(value) {
  try {
    const u=new URL(value); u.hash='';
    return `${u.protocol}//${u.host.toLowerCase()}${u.pathname.replace(/\/+$/,'')}${u.search}`;
  } catch { return ''; }
}
function normalizedText(value) {
  return String(value||'').normalize('NFKC').toLowerCase().replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/[“”]/g,'"').replace(/[‘’]/g,"'").replace(/\s+/g,' ').trim();
}

function json(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(data));
}
function logTool(job, name, details = {}) {
  const entry={ tool:name, at:new Date().toISOString(), ...details };
  job.activities.push(entry);
  console.log(JSON.stringify({ event: 'tool_call', jobId: job.id, ...entry }));
}
function safeEqual(a, b) {
  const x = Buffer.from(a || ''); const y = Buffer.from(b || '');
  return x.length === y.length && x.length > 0 && (awaitImportTimingSafeEqual(x, y));
}
import { timingSafeEqual as awaitImportTimingSafeEqual } from 'node:crypto';
function authorized(req) { return safeEqual(req.headers['x-agent-secret'], process.env.AGENT_SECRET); }
async function body(req) {
  let text = ''; for await (const chunk of req) { text += chunk; if (text.length > 4096) throw new Error('body too large'); }
  return text ? JSON.parse(text) : {};
}
function ipv4Private(ip) {
  const p = ip.split('.').map(Number); return p[0] === 10 || p[0] === 127 || p[0] === 0 || (p[0] === 169 && p[1] === 254) || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) || (p[0] === 192 && p[1] === 168) || p[0] >= 224;
}
function ipv6Private(ip) { const x = ip.toLowerCase(); return x === '::1' || x === '::' || x.startsWith('fc') || x.startsWith('fd') || x.startsWith('fe80:') || x.startsWith('::ffff:127.') || x.startsWith('::ffff:10.'); }
async function validatePublicUrl(value) {
  const u = new URL(value);
  if (u.protocol !== 'https:' || u.username || u.password) throw new Error('Only public HTTPS pages can be read.');
  const host = u.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) throw new Error('Private hosts cannot be read.');
  if (isIP(host)) { if (host.includes(':') ? ipv6Private(host) : ipv4Private(host)) throw new Error('Private IPs cannot be read.'); }
  else {
    const records = await dns.lookup(host, { all: true, verbatim: true });
    if (!records.length || records.some(r => r.family === 4 ? ipv4Private(r.address) : ipv6Private(r.address))) throw new Error('Private hosts cannot be read.');
  }
  return u;
}
async function readPublicPage(job, url) {
  if (job.reads >= MAX_READS) throw new Error('Page-read limit reached.');
  let current = url;
  for (let redirects = 0; redirects <= 3; redirects++) {
    const u = await validatePublicUrl(current);
    if (job.reads >= MAX_READS) throw new Error('Page-read limit reached.');
    job.reads++; logTool(job, 'open_page', { url: u.href, read: job.reads });
    const response = await fetch(u, { redirect: 'manual', signal: AbortSignal.any([job.controller.signal, AbortSignal.timeout(12_000)]), headers: { 'User-Agent': 'OpportunityFinder/1.0 (public-source eligibility verification)' } });
    if ([301,302,303,307,308].includes(response.status)) { const loc = response.headers.get('location'); if (!loc || redirects === 3) throw new Error('Too many or invalid redirects.'); current = new URL(loc, u).href; continue; }
    if (!response.ok) throw new Error(`Page returned HTTP ${response.status}.`);
    const type = response.headers.get('content-type') || ''; if (!/text\/(html|plain)|application\/(xhtml\+xml|pdf)/i.test(type)) throw new Error('Page is not readable text.');
    const reader = response.body.getReader(); const chunks=[]; let size=0;
    while (true) { const {done,value}=await reader.read(); if(done) break; size+=value.length; if(size>400_000){ await reader.cancel(); break; } chunks.push(value); }
    const raw = Buffer.concat(chunks).toString('utf8');
    const text=raw.replace(/<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/\s+/g,' ').slice(0,18_000);
    job.pages.set(urlKey(url),text); job.pages.set(urlKey(u.href),text); return text;
  }
  throw new Error('Could not read page.');
}
function makeAgent(job, profile) {
  const searchTool = tool({ name: 'web_search', description: 'Search the live web for current youth competitions, programs, and events. Search broadly, then verify promising items on official pages using open_page.', parameters: z.object({ query: z.string().min(4).max(300) }), async execute({ query }) {
    if (job.searches >= MAX_SEARCHES) return 'Search limit reached.';
    job.searches++; logTool(job, 'web_search', { query, search: job.searches });
    const response = await client.responses.create({ model: process.env.OPENAI_MODEL || 'gpt-6-luna', tools: [{ type: 'web_search' }], input: `Search query: ${query}\nReturn concise live search results with title, URL, date/status snippets. Do not assert eligibility unless directly supported.`, store: false }, { signal: job.controller.signal, timeout: Math.max(1_000, JOB_LIMIT_MS - (Date.now() - job.startedAt)) });
    return response.output_text || 'No search results returned.';
  } });
  const pageTool = tool({ name: 'open_page', description: 'Read one public official source page to verify age, geography, and whether applications/registration are open. Supply the exact URL.', parameters: z.object({ url: z.string().min(1).max(2048) }), async execute({ url }) { try { return await readPublicPage(job, url); } catch (e) { return `Could not verify page: ${e.message}`; } } });
  const checkMatchTool=tool({name:'check_match',description:'Once per candidate, verify that the official page you opened includes relevant age, location, and current-availability information. Pass a short verbatim excerpt from that page.',parameters:z.object({name:z.string().min(1),officialSourceUrl:z.string().min(1).max(2048),sourceText:z.string().max(1200)}),async execute({name,officialSourceUrl,sourceText}){const key=urlKey(officialSourceUrl);const actual=job.pages.get(key);logTool(job,'check_match',{name,url:officialSourceUrl});const quote=Boolean(actual&&sourceText.trim().length>=25&&normalizedText(actual).includes(normalizedText(sourceText)));const age=Boolean(quote&&/(ages?\s*\d|aged\s*\d|\d+\s*(?:to|[-–])\s*\d+\s*years?|years? old|under\s*18|children|junior|youth|teen|school year|year\s*(?:[7-9]|1[0-3])\b)/i.test(actual));const place=Boolean(quote&&/(Auckland|New Zealand|\bNZ\b|online|international|worldwide|global)/i.test(actual));const open=Boolean(quote&&/(registration|applications?|entries|sign[ -]?ups?|tickets?|enrolments?).{0,100}(open|accepting|register|apply|available|deadline|close|closing|2026|2027)|(open|accepting|register|apply|available|deadline|close|closing).{0,100}(registration|applications?|entries|sign[ -]?ups?|tickets?|enrolments?)/i.test(actual));const record={name,url:key,age,place,open,quote};job.checks.set(key,record);return JSON.stringify({sourcePageRead:Boolean(actual),quotedTextMatchesPage:quote,ageInformationFound:age,locationInformationFound:place,currentAvailabilityInformationFound:open,decision:'Include only if the source clearly confirms eligibility for this person and registration/application is open now. If unclear, investigate another official page or rule it out.',candidate:name,source:key});}});
  return new Agent({ name: 'Youth Opportunities Researcher', model: process.env.OPENAI_MODEL || 'gpt-6-luna', tools: [searchTool, pageTool, checkMatchTool], instructions: `Find up to five current opportunities (competitions, programs, events) for this profile: ${profile}. Search first. For each promising candidate, open its official source, then call check_match exactly once using that source URL and a short VERBATIM passage copied from the opened page. Do not repeat the check call for the same source. Check age limits, location eligibility and whether applications/registration are open now. Do not assume school or experience. Only include candidates whose official page supports all required checks. In each result include the exact URL you opened and a concise verbatim excerpt (8–25 words) copied from that page. The excerpt must appear exactly on the source page; do not paraphrase. If any check is unclear, seek another official source or rule the candidate out. Explain ruled-out leads. Return JSON only: {"opportunities":[{"name":"","type":"","summary":"","ageEligibility":"","locationEligibility":"","availability":"","sourceUrl":"","sourceExcerpt":""}],"ruledOut":[{"name":"","reason":""}],"note":""}. No invented items. Respect the available search/read limits.` });
}
async function executeJob(job) {
  const profile = await readFile(PROFILE_PATH, 'utf8');
  const timeout = setTimeout(() => job.controller.abort(new Error('Four-minute limit reached.')), JOB_LIMIT_MS);
  try {
    const result = await run(makeAgent(job, profile), 'Research current opportunities now. First use web_search to discover candidates.', { signal: job.controller.signal, maxTurns: 50 });
    let parsed; try { parsed=JSON.parse(result.finalOutput); } catch { parsed={opportunities:[],ruledOut:[],note:'The research response was not in a verifiable format.'}; }
    const excluded=[]; const accepted=[];
    for(const item of (Array.isArray(parsed.opportunities)?parsed.opportunities:[]).slice(0,15)){
      const key=urlKey(item.sourceUrl); const check=job.checks.get(key); const page=job.pages.get(key);
      const excerpt=String(item.sourceExcerpt||'').trim();
      if(check?.age&&check.place&&check.open&&check.quote&&page&&excerpt.length>=25&&normalizedText(page).includes(normalizedText(excerpt)))accepted.push(item);
      else excluded.push({name:item.name||'Unverified candidate',reason:'Official-source evidence did not confirm the age, location, current availability, and quoted excerpt together.'});
      if(accepted.length>=5)break;
    }
    const rawCount=Array.isArray(parsed.opportunities)?parsed.opportunities.length:0;
    const note=accepted.length===0&&rawCount>0?`The agent proposed ${rawCount} possible match(es), but none passed the final official-source evidence check. Treat them as unverified; see the ruled-out list.`:accepted.length===0?'No opportunity passed all official-source checks in this run.':`Verified ${accepted.length} opportunity/opportunities against the opened official pages.`;
    job.result = {opportunities:accepted,ruledOut:[...(Array.isArray(parsed.ruledOut)?parsed.ruledOut:[]),...excluded],note}; job.status = 'done';
  } catch (e) { job.status = job.controller.signal.aborted ? 'cancelled' : 'error'; job.error = job.controller.signal.aborted ? 'The search was cancelled or reached its four-minute limit.' : 'The search failed. Please try again later.'; let reason=String(e?.message||'unknown'); for(const value of [process.env.OPENAI_API_KEY,process.env.AGENT_SECRET])if(value)reason=reason.split(value).join('[redacted]'); reason=reason.replace(/sk-[A-Za-z0-9_-]{12,}/g,'[redacted]'); console.error(JSON.stringify({ event: 'job_error', jobId: job.id, type: e?.name || 'Error', reason:reason.slice(0,300) })); }
  finally { clearTimeout(timeout); job.finishedAt = Date.now(); }
}
const server = createServer(async (req,res) => {
  const url = new URL(req.url || '/', 'http://localhost');
  if (url.pathname === '/' && req.method === 'GET') { res.writeHead(200, { 'Content-Type':'text/plain; charset=utf-8', 'Cache-Control':'no-store' }); return res.end('agent is running'); }
  if (!authorized(req)) return json(res, 401, { error: 'Unauthorized.' });
  if (url.pathname === '/jobs' && req.method === 'POST') {
    try { await body(req); const id = crypto.randomUUID(); const job={ id, status:'running', searches:0, reads:0, activities:[], pages:new Map(), checks:new Map(), startedAt:Date.now(), controller:new AbortController() }; jobs.set(id,job); void executeJob(job); return json(res,202,{id,status:job.status}); } catch { return json(res,400,{error:'Invalid request.'}); }
  }
  const m=url.pathname.match(/^\/jobs\/([\w-]+)(\/cancel)?$/); if (!m) return json(res,404,{error:'Not found.'}); const job=jobs.get(m[1]); if(!job) return json(res,404,{error:'Job not found.'});
  if (m[2] && req.method==='POST') { if(job.status==='running') job.controller.abort(); return json(res,200,{id:job.id,status:'cancelling'}); }
  if (!m[2] && req.method==='GET') return json(res,200,{id:job.id,status:job.status,progress:{searches:job.searches,pageReads:job.reads,elapsedMs:(job.finishedAt||Date.now())-job.startedAt,events:job.activities.slice(-50).map(a=>({at:a.at,label:a.tool==='web_search'?'Searching the web':a.tool==='open_page'?'Reading official source':'Checking match',...(a.query?{query:a.query}:{}),...(a.url?{url:a.url}:{}),...(a.name?{name:a.name}:{})}))},...(job.status==='done'?{results:job.result}:{}),...(job.error?{error:job.error}:{})});
  return json(res,405,{error:'Method not allowed.'});
});
server.listen(PORT,'0.0.0.0',()=>{
  console.log(`Opportunity agent listening on ${PORT}`);
  console.log(JSON.stringify({event:'agent_ready',port:PORT,healthcheck:'/',resultsFormat:'object'}));
});
