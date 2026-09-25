"use client";

import { FormEvent, useState } from 'react';

const routes = ['AI Security', 'Practical AI', 'Build in Public', 'Career and Learning'];
const gates = [
  ['Evidence completeness', 'Ready', 'ok'],
  ['Reader gain', 'Ready', 'ok'],
  ['Voice fidelity', 'Needs review', 'warn'],
  ['No unsupported claims', 'Ready', 'ok'],
];

export default function Home() {
  const [showIdeaForm, setShowIdeaForm] = useState(false);
  const [title, setTitle] = useState('');
  const [rawNote, setRawNote] = useState('');
  const [ideaState, setIdeaState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [researchState, setResearchState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [research, setResearch] = useState<{ selectedHeadline?: string; whyItMatters?: string; angle?: string; draft?: string; sourceUrls?: string[] } | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [approval, setApproval] = useState<'review' | 'approved' | 'scheduled'>('review');
  const [followUp, setFollowUp] = useState('');

  async function createIdea(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    setIdeaState('saving');
    try {
      const response = await fetch('/api/ideas', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title, rawNote }) });
      if (!response.ok) throw new Error('Unable to save idea');
      setTitle(''); setRawNote(''); setIdeaState('saved');
    } catch { setIdeaState('error'); }
  }

  async function runResearch() {
    setResearchState('loading');
    try {
      const response = await fetch('/api/research', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error('Research failed');
      setResearch(payload.result); setFollowUp('A useful question to carry into the week: where should we demand proof before trusting an AI system?'); setApproval('review');
      const saved = await fetch('/api/drafts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ headline: payload.result.selectedHeadline, body: payload.result.draft, followUpComment: 'A useful question to carry into the week: where should we demand proof before trusting an AI system?', sourceUrls: payload.result.sourceUrls ?? [] }) });
      if (!saved.ok) throw new Error('Draft could not be saved');
      const savedPayload = await saved.json(); setDraftId(savedPayload.draft.id); setResearchState('ready');
    } catch { setResearchState('error'); }
  }

  return <main className="shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">W</span><span>Writeet</span></div>
      <p className="eyebrow">Publishing workspace</p>
      <nav><a className="active" href="#overview">Overview</a><a href="#ideas">Ideas</a><a href="#drafts">Drafts</a><a href="#schedule">Schedule</a><a href="#audit">Audit trail</a></nav>
      <div className="sidebar-foot"><span className="status-dot" /> Publishing paused<br /><small>Safe default until LinkedIn is connected</small></div>
    </aside>
    <section className="content">
      <header className="topbar"><div><p className="eyebrow">Wednesday · 23 September 2026</p><h1>Good morning, Olarewaju.</h1></div><a className="ghost" href="/login">Settings</a></header>
      <div className="notice"><span className="notice-icon">!</span><div><strong>Publishing is paused.</strong><span> Connect LinkedIn and pass the quality gates before scheduling goes live.</span></div><a className="text-button" href="#audit">Review setup →</a></div>
      <div className="grid" id="overview">
        <section className="panel hero-panel"><div className="panel-kicker">Next useful action</div><h2>Turn one trusted source into three candidates.</h2><p>Start with an idea, note, or approved URL. Writeet will keep evidence and interpretation separate as it drafts.</p><div className="hero-actions"><button className="primary" onClick={() => { setShowIdeaForm(true); setIdeaState('idle'); }}>Add an idea <span>＋</span></button><button className="secondary" onClick={runResearch} disabled={researchState === 'loading'}>{researchState === 'loading' ? 'Researching…' : 'Research AI news'}</button></div></section>
        <section className="panel signal-panel"><div className="panel-head"><div><div className="panel-kicker">This week</div><h3>Pipeline health</h3></div><span className="score">72%</span></div><div className="progress"><span /></div><div className="metric-row"><span>Ideas in review</span><strong>04</strong></div><div className="metric-row"><span>Drafts ready</span><strong>02</strong></div><div className="metric-row"><span>Scheduled</span><strong>00</strong></div></section>
      </div>
      <div className="section-heading"><div><p className="eyebrow">Current work</p><h2>One decision at a time</h2></div><button className="text-button">View all drafts →</button></div>
      <section className="panel draft-card" id="drafts"><div className="draft-meta"><span className="tag">Practical AI</span><span>Draft 03 · generated 12 min ago</span></div><h3>What changes when an AI workflow has to explain itself?</h3><p className="muted">A practical note on making evidence visible before a useful automation becomes a risky one.</p><div className="gates">{gates.map(([name, state, tone]) => <div className="gate" key={name}><span className={`gate-dot ${tone}`} /><span>{name}</span><strong>{state}</strong></div>)}</div><div className="draft-footer"><span className="score-badge">78 <small>/ 100</small></span><button className="secondary">Open evaluation</button></div></section>
      {research && <section className="panel research-result" id="research"><div className="draft-meta"><span className="tag">Fresh research draft</span><span>{approval === 'review' ? 'Awaiting your review' : approval === 'approved' ? 'Approved · choose a time' : 'Scheduled for LinkedIn'}</span></div><h3>{research.selectedHeadline}</h3><p className="muted">{research.whyItMatters}</p><div className="research-copy">{research.draft}</div><label className="review-field">Follow-up comment<textarea value={followUp} onChange={(event) => setFollowUp(event.target.value)} rows={3} /></label><div className="draft-footer"><span className="muted">{approval === 'review' ? 'Review both pieces before approving' : 'Ready for your schedule'}</span><div className="hero-actions">{approval === 'review' && <button className="primary" onClick={async () => { if (!draftId) return; await fetch(`/api/drafts/${draftId}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'approved', follow_up_comment: followUp }) }); setApproval('approved'); }}>Approve draft</button>}{approval === 'approved' && <button className="primary" onClick={async () => { if (!draftId) return; await fetch(`/api/drafts/${draftId}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'scheduled', scheduled_for: new Date(Date.now() + 86400000).toISOString(), follow_up_comment: followUp }) }); setApproval('scheduled'); }}>Schedule for tomorrow morning</button>}{approval === 'scheduled' && <span className="approval-badge">Queued ✓</span>}</div></div></section>}
      {researchState === 'error' && <p className="form-message error">Research could not be completed. Check the AI provider connection.</p>}
      <div className="section-heading routes-heading"><div><p className="eyebrow">Content routes</p><h2>Keep the mix intentional</h2></div><button className="text-button">Manage routes →</button></div>
      <section className="route-list" id="audit">{routes.map((route, i) => <a className="route" href="#ideas" key={route}><span className="route-number">0{i + 1}</span><span>{route}</span><span className="route-count">{[3, 2, 1, 0][i]} ideas</span><span className="arrow">↗</span></a>)}</section>
      {showIdeaForm && <div className="modal-backdrop" role="presentation" onClick={() => setShowIdeaForm(false)}><section className="idea-modal" role="dialog" aria-modal="true" aria-labelledby="idea-title" onClick={(event) => event.stopPropagation()}><div className="modal-head"><div><p className="eyebrow">Ideas inbox</p><h2 id="idea-title">Add a new idea</h2></div><button className="close-button" onClick={() => setShowIdeaForm(false)} aria-label="Close">×</button></div><form onSubmit={createIdea}><label>Title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What should we explore?" required /></label><label>Context or note<textarea value={rawNote} onChange={(event) => setRawNote(event.target.value)} placeholder="Add the source, observation, or question behind it." rows={5} /></label><div className="modal-actions"><button type="button" className="secondary" onClick={() => setShowIdeaForm(false)}>Cancel</button><button className="primary" disabled={ideaState === 'saving'}>{ideaState === 'saving' ? 'Saving…' : 'Save idea'}</button></div>{ideaState === 'saved' && <p className="form-message success">Idea saved to your workspace.</p>}{ideaState === 'error' && <p className="form-message error">Could not save this idea. Check the connection and try again.</p>}</form></section></div>}
    </section>
  </main>;
}
