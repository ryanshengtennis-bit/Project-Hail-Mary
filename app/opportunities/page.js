'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import './opportunities.css';

const isActive = (status) => status === 'running' || status === 'cancelling';

function sourceLink(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch { return null; }
}

function elapsedLabel(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

async function request(path, { method = 'GET', data, signal } = {}) {
  const timeout = AbortSignal.timeout(15_000);
  const response = await fetch(path, {
    method,
    headers: data ? { 'Content-Type': 'application/json' } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: 'same-origin',
    cache: 'no-store',
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(result?.error || `Request failed (${response.status}). Please try again.`);
    error.status = response.status;
    throw error;
  }
  if (!result || typeof result !== 'object') throw new Error('The site returned an unreadable response. Please try again.');
  return result;
}

export default function OpportunitiesPage() {
  const [password, setPassword] = useState('');
  const [askingPassword, setAskingPassword] = useState(false);
  const [starting, setStarting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');
  const [disconnected, setDisconnected] = useState(false);
  const [retry, setRetry] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const elapsedSnapshot = useRef({ value: 0, at: 0 });
  const startPending = useRef(false);
  const jobId = job?.id;
  const active = isActive(job?.status);

  useEffect(() => {
    if (!jobId) return;
    const controller = new AbortController();
    let disposed = false;
    let timer;
    setDisconnected(false);

    async function poll() {
      try {
        const next = await request(`/api/jobs/${encodeURIComponent(jobId)}/`, { signal: controller.signal });
        if (disposed) return;
        if (next.id !== jobId || !['running', 'cancelling', 'done', 'error', 'cancelled'].includes(next.status)) {
          throw new Error('The agent returned unexpected progress. Please reconnect or cancel this search.');
        }
        const elapsed = Math.max(0, Number(next.progress?.elapsedMs) || 0);
        elapsedSnapshot.current = { value: elapsed, at: Date.now() };
        setElapsedMs(elapsed);
        setJob(next);
        setDisconnected(false);
        if (isActive(next.status)) {
          timer = setTimeout(poll, 2000);
        } else {
          setCancelling(false);
          if (next.status === 'error') setError(next.error || 'The search failed. Please refresh to try again.');
          if (next.status === 'cancelled') setError(next.error || 'Search cancelled.');
        }
      } catch (problem) {
        if (disposed) return;
        setDisconnected(true);
        setCancelling(false);
        if (problem.status === 401 || problem.status === 404) setJob(current => ({ ...current, status: 'error' }));
        setError(problem.name === 'TimeoutError' ? 'Progress took too long to load. Reconnect to check the search, or cancel it.' : problem.message);
      }
    }

    poll();
    return () => {
      disposed = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [jobId, retry]);

  useEffect(() => {
    if (!active || disconnected) return;
    const timer = setInterval(() => {
      const snapshot = elapsedSnapshot.current;
      setElapsedMs(snapshot.value + Math.max(0, Date.now() - snapshot.at));
    }, 1000);
    return () => clearInterval(timer);
  }, [active, disconnected]);

  async function refresh(event) {
    event.preventDefault();
    if (startPending.current || active) return;
    startPending.current = true;
    setStarting(true);
    setError('');
    try {
      const started = await request('/api/jobs/', { method: 'POST', data: { password } });
      if (typeof started.id !== 'string' || !/^[\w-]+$/.test(started.id)) {
        throw new Error('The agent did not return a search ID. Please try again.');
      }
      elapsedSnapshot.current = { value: 0, at: Date.now() };
      setElapsedMs(0);
      setJob({ id: started.id, status: 'running', progress: { searches: 0, pageReads: 0, events: [] } });
      setPassword('');
      setAskingPassword(false);
    } catch (problem) {
      setError(problem.name === 'TimeoutError' ? 'Starting the search timed out. Please try again.' : problem.message);
    } finally {
      startPending.current = false;
      setStarting(false);
    }
  }

  async function cancel() {
    if (!jobId || cancelling) return;
    setCancelling(true);
    setError('');
    try {
      await request(`/api/jobs/${encodeURIComponent(jobId)}/cancel/`, { method: 'POST', data: {} });
      setRetry(value => value + 1);
    } catch (problem) {
      setCancelling(false);
      if (problem.status === 401 || problem.status === 404) setJob(current => ({ ...current, status: 'error' }));
      setError(problem.name === 'TimeoutError' ? 'Cancellation could not be confirmed. Try cancelling again.' : `Cancellation failed: ${problem.message}`);
    }
  }

  const events = Array.isArray(job?.progress?.events) ? job.progress.events : [];
  const latest = events[events.length - 1];
  const activity = cancelling ? 'Cancelling search…'
    : disconnected ? 'Progress connection interrupted'
    : active ? latest?.label || 'Waiting for agent activity'
    : job?.status === 'done' ? 'Research complete'
    : job?.status === 'cancelled' ? 'Search cancelled'
    : 'Search stopped';
  const result = job?.status === 'done' && job.results && typeof job.results === 'object' ? job.results : null;
  const opportunities = Array.isArray(result?.opportunities) ? result.opportunities : [];
  const ruledOut = Array.isArray(result?.ruledOut) ? result.ruledOut : [];

  return (
    <main className="opportunities-page">
      <Link className="opportunities-back" href="/">← Back to Ryan’s site</Link>
      <header className="opportunities-hero">
        <p className="opportunities-kicker">✦ YOUR NEXT ADVENTURE</p>
        <h1>Opportunities</h1>
        <p>Fresh competitions, programs and events in music, biology and sport—checked against official sources for your age and location.</p>
      </header>

      <section className="opportunities-control" aria-label="Opportunity search">
        {!askingPassword && (
          <div className="opportunities-refresh-row">
            <div><h2>Find your next opportunity</h2><p>Start a fresh search with your site password. Research can take up to four minutes.</p></div>
            <button type="button" className="opportunities-button" disabled={starting || active} onClick={() => { setError(''); setAskingPassword(true); }}>
              {active ? 'Research in progress…' : 'Refresh opportunities'}
            </button>
          </div>
        )}
        {askingPassword && (
          <form onSubmit={refresh}>
            <label htmlFor="opportunity-password">Enter your site password to refresh</label>
            <div className="opportunities-form-row">
              <input id="opportunity-password" type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" required autoFocus disabled={starting} placeholder="Site password" />
              <button className="opportunities-button" disabled={starting}>{starting ? 'Starting…' : 'Start search'}</button>
              <button type="button" className="opportunities-dismiss" disabled={starting} onClick={() => { setAskingPassword(false); setPassword(''); }}>Back</button>
            </div>
          </form>
        )}
        {error && <p className="opportunities-error" role="alert">{error}</p>}
        {job && (
          <div className="opportunities-live">
            <div className="opportunities-progress" role="status">
              {active && !disconnected && <span className="opportunities-pulse" aria-hidden="true" />}
              <strong>{activity}</strong>
              <span>{job.progress?.searches || 0} searches · {job.progress?.pageReads || 0} source reads · {elapsedLabel(elapsedMs)} elapsed</span>
            </div>
            <div className="opportunities-live-actions">
              {active && disconnected && <button type="button" className="opportunities-button" onClick={() => { setError(''); setRetry(value => value + 1); }}>Reconnect</button>}
              {active && <button type="button" className="opportunities-cancel" disabled={cancelling} onClick={cancel}>{cancelling ? 'Cancelling…' : 'Cancel search'}</button>}
            </div>
          </div>
        )}
      </section>

      {job && (
        <details className="opportunities-activity">
          <summary>Research activity ({events.length})</summary>
          {!events.length && <p>The agent’s searches and source reads will appear here as they happen.</p>}
          <ol>
            {events.map((event, index) => {
              const url = sourceLink(event.url);
              return <li key={`${event.at}-${index}`}>
                <span>{event.label}{event.name ? ` · ${event.name}` : ''}</span>
                {event.at && <time dateTime={event.at}>{new Date(event.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</time>}
                {event.query && <small>“{event.query}”</small>}
                {url && <a href={url} target="_blank" rel="noopener noreferrer">{url} ↗</a>}
              </li>;
            })}
          </ol>
        </details>
      )}

      {result && (
        <section className="opportunities-results">
          <h2>Verified opportunities</h2>
          <p className="opportunities-count">{opportunities.length} matched · Results clear when you leave or reload this page.</p>
          {result.note && <p className="opportunities-count">{result.note}</p>}
          {!opportunities.length && <p className="opportunities-empty">No opportunities could be verified this time. See the research activity and ruled-out items for details.</p>}
          <div className="opportunity-grid">
            {opportunities.map((item, index) => {
              const url = sourceLink(item.sourceUrl);
              return <article className="opportunity-card" key={`${item.name}-${index}`}>
                <p className="opportunity-type">{item.type || 'Opportunity'}</p>
                <h3>{item.name}</h3>
                <p>{item.summary}</p>
                <dl>
                  {[['Age', item.ageEligibility], ['Location', item.locationEligibility], ['Availability', item.availability]].map(([label, value]) => value && <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
                </dl>
                {item.sourceExcerpt && <blockquote>“{item.sourceExcerpt}”</blockquote>}
                {url && <a className="opportunity-source" href={url} target="_blank" rel="noopener noreferrer">Official source ↗</a>}
              </article>;
            })}
          </div>
          <details className="opportunities-ruledout">
            <summary>What was ruled out ({ruledOut.length})</summary>
            {ruledOut.length ? <ul>{ruledOut.map((item, index) => <li key={`${item.name}-${index}`}><strong>{item.name}</strong> — {item.reason}</li>)}</ul> : <p>No ruled-out items were reported.</p>}
          </details>
        </section>
      )}
      <p className="opportunities-footnote">Every listed opportunity is checked against an official source. If eligibility or current availability can’t be confirmed, it won’t be listed.</p>
    </main>
  );
}
