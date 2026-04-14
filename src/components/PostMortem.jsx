import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SCENARIOS } from '../data/scenarios';
import { GC } from '../utils/constants';
import { useCompleted } from './CompletedContext';

/* ── Interview Practice Sub-component ── */
function InterviewPractice({ sc, pm }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [qIdx, setQIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const endRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const start = () => {
    const q = pm.interviewQs?.[qIdx];
    if (!q) return;
    setOpen(true);
    setMsgs([{ role: 'assistant', content: `면접 질문입니다.\n\n"${q}"` }]);
  };

  const nextQ = () => {
    const next = qIdx + 1;
    if (next >= (pm.interviewQs?.length || 0)) return;
    setQIdx(next);
    setMsgs([{ role: 'assistant', content: `다음 질문입니다.\n\n"${pm.interviewQs[next]}"` }]);
    setInput('');
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input };
    const newMsgs = [...msgs, userMsg];
    setMsgs(newMsgs);
    setInput('');
    setLoading(true);

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const history = newMsgs.map(m => `${m.role === 'user' ? '지원자' : '면접관'}: ${m.content}`).join('\n');
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          messages: [{ role: 'user', content: `당신은 이커머스 백엔드 시니어 개발자 면접관입니다.\n시나리오: ${sc.title}\n핵심 개념: ${sc.tags.join(', ')}\n근본 원인: ${pm.rc}\n\n대화 기록:\n${history}\n\n면접관 규칙:\n1. 지원자 답변에서 좋은 점을 먼저 짚어주세요.\n2. 부족하거나 틀린 부분이 있다면 구체적으로 피드백하세요.\n3. STAR 기법(Situation-Task-Action-Result)으로 답변 구조화를 유도하세요.\n4. 실제 면접에서 합격/불합격 수준인지 솔직히 평가하세요.\n5. 3~4문장으로 답하세요. 마크다운 사용하지 마세요.\n6. 한국어로 답변하세요.` }]
        })
      });
      if (!resp.ok) throw new Error(`서버 오류 (${resp.status})`);
      const data = await resp.json();
      const aiText = data.content?.map(c => c.text || '').join('') || '피드백을 생성하지 못했습니다.';
      setMsgs(prev => [...prev, { role: 'assistant', content: aiText }]);
    } catch (e) {
      if (e.name === 'AbortError') return;
      setMsgs(prev => [...prev, { role: 'assistant', content: `AI 면접관 연결에 실패했습니다. (${e.message})\n\n자가 체크리스트로 답변을 점검해보세요:\n1. STAR 기법(상황-과제-행동-결과)으로 구조화했나요?\n2. 구체적인 수치(응답시간, 에러율 등)를 포함했나요?\n3. 왜 그 판단을 했는지 근거를 설명했나요?\n4. 다른 선택지와의 트레이드오프를 언급했나요?` }]);
    }
    setLoading(false);
  };

  return (
    <section className="card" style={{ marginBottom: 12, padding: '16px 20px' }} aria-label="면접 연습">
      <div className="tag" style={{ color: 'var(--purple, #a855f7)', marginBottom: 8 }}>🎤 면접 답변 연습</div>
      <p style={{ fontSize: 13, color: 'var(--sec)', marginBottom: 12, lineHeight: 1.6 }}>
        이 시나리오에서 배운 내용을 면접에서 어떻게 말할지 연습해보세요. AI 면접관이 피드백을 드립니다.
      </p>
      {!open ? (
        <button className="btn btn--primary btn--sm" onClick={start}>면접 연습 시작</button>
      ) : (
        <>
          <div className="chat-messages" role="log" aria-label="면접 대화" style={{ maxHeight: 360, overflowY: 'auto', marginBottom: 10 }}>
            {msgs.map((msg, i) => (
              <div key={i} className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble--user' : 'chat-bubble--ai'}`}>
                {msg.role === 'assistant' && <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--purple, #a855f7)', marginBottom: 4, fontWeight: 600 }}>🎤 AI 면접관</div>}
                {msg.content}
              </div>
            ))}
            {loading && <div className="chat-bubble chat-bubble--ai"><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>면접관이 평가하는 중 <span className="loading-dots"><span /><span /><span /></span></span></div>}
            <div ref={endRef} />
          </div>
          <textarea
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="면접 답변을 작성하세요... (STAR 기법: 상황-과제-행동-결과)"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            aria-label="면접 답변 입력"
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn--primary btn--sm" disabled={loading || !input.trim()} onClick={send}>답변 제출</button>
            {qIdx < (pm.interviewQs?.length || 0) - 1 && msgs.length > 1 && (
              <button className="btn btn--ghost" onClick={nextQ}>다음 질문 →</button>
            )}
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
              질문 {qIdx + 1}/{pm.interviewQs.length}
            </span>
          </div>
        </>
      )}
    </section>
  );
}

/* ── Code Challenge Sub-component ── */
function CodeChallenge({ sc, pm }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [msgs, setMsgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const start = () => {
    setOpen(true);
    setCode(pm.codeChallenge?.starterCode || '');
    setMsgs([]);
  };

  const submit = async () => {
    if (!code.trim() || loading) return;
    const userMsg = { role: 'user', content: code };
    setMsgs(prev => [...prev, userMsg]);
    setLoading(true);

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const ch = pm.codeChallenge;
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          messages: [{ role: 'user', content: `당신은 이커머스 백엔드 시니어 개발자 코드 리뷰어입니다.\n시나리오: ${sc.title}\n과제: ${ch.prompt}\n힌트: ${ch.hint}\n\n지원자가 제출한 코드:\n${code}\n\n리뷰 규칙:\n1. 코드에서 잘한 점을 먼저 짚어주세요.\n2. 버그, 엣지 케이스, 성능 이슈가 있다면 구체적으로 짚어주세요.\n3. 개선 방향을 제시하되, 정답 코드를 직접 작성하지는 마세요.\n4. 실제 PR 리뷰 톤으로 3~5문장 작성하세요.\n5. 한국어로 답변하세요. 마크다운 사용하지 마세요.` }]
        })
      });
      if (!resp.ok) throw new Error(`서버 오류 (${resp.status})`);
      const data = await resp.json();
      const aiText = data.content?.map(c => c.text || '').join('') || '리뷰를 생성하지 못했습니다.';
      setMsgs(prev => [...prev, { role: 'assistant', content: aiText }]);
    } catch (e) {
      if (e.name === 'AbortError') return;
      setMsgs(prev => [...prev, { role: 'assistant', content: `AI 리뷰어 연결에 실패했습니다. (${e.message})\n\n셀프 코드 리뷰 체크리스트:\n1. 엣지 케이스(빈 값, 0, null)를 처리했나요?\n2. 에러 핸들링이 포함되어 있나요?\n3. 성능 관점에서 비효율적인 부분은 없나요?\n4. 실제 프로덕션에서 이 코드가 안전한가요?` }]);
    }
    setLoading(false);
  };

  return (
    <section className="card" style={{ marginBottom: 12, padding: '16px 20px' }} aria-label="코드 챌린지">
      <div className="tag" style={{ color: 'var(--green)', marginBottom: 8 }}>💻 코드 챌린지</div>
      <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{pm.codeChallenge.title}</p>
      <p style={{ fontSize: 13, color: 'var(--sec)', marginBottom: 8, lineHeight: 1.6 }}>{pm.codeChallenge.prompt}</p>
      <p style={{ fontSize: 12, color: 'var(--yellow)', marginBottom: 12 }}>💡 힌트: {pm.codeChallenge.hint}</p>
      {!open ? (
        <button className="btn btn--primary btn--sm" onClick={start}>코드 작성 시작</button>
      ) : (
        <>
          <div className="code-editor">
            <div className="code-editor__lines" aria-hidden="true">
              {code.split('\n').map((_, i) => (
                <div key={i} className="code-editor__line-num">{i + 1}</div>
              ))}
            </div>
            <textarea
              className="code-editor__textarea"
              value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  const { selectionStart, selectionEnd } = e.target;
                  const newVal = code.substring(0, selectionStart) + '  ' + code.substring(selectionEnd);
                  setCode(newVal);
                  requestAnimationFrame(() => {
                    e.target.selectionStart = e.target.selectionEnd = selectionStart + 2;
                  });
                }
              }}
              spellCheck={false}
              aria-label="코드 입력"
            />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
            <button className="btn btn--primary btn--sm" disabled={loading || !code.trim()} onClick={submit}>AI 코드 리뷰 요청</button>
            {loading && <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>리뷰 중 <span className="loading-dots"><span /><span /><span /></span></span>}
          </div>
          {msgs.length > 0 && (
            <div className="chat-messages" role="log" aria-label="코드 리뷰" style={{ maxHeight: 300, overflowY: 'auto', marginTop: 10 }}>
              {msgs.map((msg, i) => (
                msg.role === 'assistant' && (
                  <div key={i} className="chat-bubble chat-bubble--ai">
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--green)', marginBottom: 4, fontWeight: 600 }}>💻 AI 코드 리뷰어</div>
                    {msg.content}
                  </div>
                )
              ))}
              <div ref={endRef} />
            </div>
          )}
        </>
      )}
    </section>
  );
}

function drawResultCard(canvas, { icon, title, pct, comment, sColorHex, tags, hist }) {
  const W = 600, H = 340;
  canvas.width = W * 2; canvas.height = H * 2;
  canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#080b12');
  grad.addColorStop(1, '#111827');
  ctx.fillStyle = grad;
  ctx.beginPath();
  const r = 16;
  ctx.moveTo(r, 0); ctx.lineTo(W - r, 0); ctx.quadraticCurveTo(W, 0, W, r);
  ctx.lineTo(W, H - r); ctx.quadraticCurveTo(W, H, W - r, H);
  ctx.lineTo(r, H); ctx.quadraticCurveTo(0, H, 0, H - r);
  ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.fill();

  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = '600 11px "JetBrains Mono", monospace';
  ctx.fillStyle = '#3b82f6';
  ctx.fillText('INCIDENT SIMULATOR', 32, 38);

  ctx.font = '32px sans-serif';
  ctx.fillText(icon, 32, 82);

  ctx.font = '700 18px "Noto Sans KR", sans-serif';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText(title.length > 28 ? title.slice(0, 28) + '...' : title, 76, 78);

  ctx.font = '700 64px "JetBrains Mono", monospace';
  ctx.fillStyle = sColorHex;
  ctx.fillText(`${pct}%`, 32, 168);

  ctx.font = '400 14px "Noto Sans KR", sans-serif';
  ctx.fillStyle = '#8896b3';
  ctx.fillText(comment, 32, 196);

  const gradeColors = { best: '#22c55e', ok: '#eab308', bad: '#ef4444' };
  let x = 32;
  hist.forEach((h, i) => {
    const c = gradeColors[h.g] || '#4a5568';
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x + 8, 228, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#080b12';
    ctx.textAlign = 'center';
    ctx.fillText(String(i + 1), x + 8, 232);
    ctx.textAlign = 'left';
    x += 24;
  });

  ctx.font = '400 11px "JetBrains Mono", monospace';
  ctx.fillStyle = '#4a5568';
  x = 32;
  const tagStr = tags.join(' · ');
  ctx.fillText(tagStr.length > 60 ? tagStr.slice(0, 60) + '…' : tagStr, 32, 268);

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(32, 290, W - 64, 1);
  ctx.font = '400 11px "JetBrains Mono", monospace';
  ctx.fillStyle = '#4a5568';
  ctx.fillText('#현업시뮬레이션  #백엔드  #MSA', 32, 314);
  ctx.textAlign = 'right';
  ctx.fillText('incident-sim.dev', W - 32, 314);
  ctx.textAlign = 'left';
}

export default function PostMortem({ sc, state, onRestart }) {
  const navigate = useNavigate();
  const { completed, saveCompleted } = useCompleted();
  const [copied, setCopied] = useState(false);
  const [imgSaved, setImgSaved] = useState(false);
  const cardCanvasRef = useRef(null);
  const pm = sc.pm;

  const maxS = state.hist.length * 20;
  const pct = maxS ? Math.round((state.score / maxS) * 100) : 0;

  let comment = '', sColor = 'var(--red)';
  if (pct >= 85) { comment = '시니어급 판단력!'; sColor = 'var(--green)'; }
  else if (pct >= 65) { comment = '좋은 판단력. 몇 가지만 보완하면 현업 수준.'; sColor = 'var(--blue)'; }
  else if (pct >= 45) { comment = '기본 판단은 하지만 운영 경험이 더 필요합니다.'; sColor = 'var(--yellow)'; }
  else { comment = '이 시뮬레이션이 경험의 시작입니다.'; }

  useEffect(() => {
    const prev = completed[sc.id];
    if (!prev || state.score > prev.score) {
      saveCompleted({ ...completed, [sc.id]: { score: state.score, maxS, pct, cat: sc.cat, date: new Date().toISOString() } });
    }
  }, [sc.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const sColorHex = pct >= 85 ? '#22c55e' : pct >= 65 ? '#3b82f6' : pct >= 45 ? '#eab308' : '#ef4444';

  useEffect(() => {
    if (cardCanvasRef.current) {
      drawResultCard(cardCanvasRef.current, {
        icon: sc.icon, title: sc.title, pct, comment, sColorHex,
        tags: sc.tags, hist: state.hist,
      });
    }
  }, [sc, pct, comment, sColorHex, state.hist]);

  const handleCopyText = useCallback(() => {
    const text = `[INCIDENT SIMULATOR] ${sc.icon} ${sc.title}\n점수: ${state.score}/${maxS} (${pct}%)\n${comment}\n\n의사결정 타임라인:\n${state.hist.map((h, i) => `  ${i + 1}. ${GC[h.g].emoji} ${h.t}`).join('\n')}\n\n#현업시뮬레이션 #백엔드 #MSA`;
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [sc, state, maxS, pct, comment]);

  const handleSaveImage = useCallback(() => {
    const canvas = cardCanvasRef.current;
    if (!canvas) return;
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `incident-sim-${sc.id}-${pct}pct.png`;
      a.click();
      URL.revokeObjectURL(url);
      setImgSaved(true);
      setTimeout(() => setImgSaved(false), 2000);
    }, 'image/png');
  }, [sc.id, pct]);

  return (
    <main className="page">
      <div className="container">
        {/* ── Score Ring ── */}
        <section className="card" style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }} aria-label="종합 점수">
          <div className="score-ring">
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle className="score-ring__track" cx="70" cy="70" r="58" />
              <circle className="score-ring__fill" cx="70" cy="70" r="58"
                style={{ stroke: sColorHex, strokeDasharray: `${2 * Math.PI * 58}`, strokeDashoffset: `${2 * Math.PI * 58 * (1 - pct / 100)}` }} />
            </svg>
            <div className="score-ring__text">
              <div className="score-ring__pct" style={{ color: sColor }}>{pct}%</div>
              <div className="score-ring__label">{state.score}/{maxS}점</div>
            </div>
          </div>
          <p style={{ fontSize: 14, color: 'var(--sec)' }}>{comment}</p>
        </section>

        {/* ── Learning Section ── */}
        <div className="section-group" aria-label="학습 내용">
          <div className="section-group__title">📋 포스트모템 — {sc.company}</div>

          <div style={{ marginBottom: 'var(--space-md)' }}>
            <div className="tag" style={{ color: 'var(--blue)', marginBottom: 6 }}>근본 원인</div>
            <p style={{ fontSize: 14, color: 'var(--sec)', lineHeight: 1.7 }}>{pm.rc}</p>
          </div>

          {pm.qa.map((qa, i) => (
            <div key={i} style={{ marginBottom: 'var(--space-sm)', padding: '12px 0', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)', marginBottom: 5 }}>Q. {qa.q}</div>
              <div style={{ fontSize: 13, color: 'var(--sec)', lineHeight: 1.7 }}>A. {qa.a}</div>
            </div>
          ))}
        </div>

        {/* ── Action Items Section ── */}
        <div className="section-group" aria-label="액션 아이템">
          <div className="section-group__title">🚀 다음 행동</div>

          {pm.pl && (
            <div style={{ marginBottom: 'var(--space-md)', padding: '12px 14px', background: 'rgba(59,130,246,0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(59,130,246,0.15)' }}>
              <div className="tag" style={{ color: 'var(--blue)', marginBottom: 6 }}>💼 포트폴리오 한 줄</div>
              <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7, fontWeight: 600 }}>{pm.pl}</p>
            </div>
          )}

          {pm.checklist && (
            <div aria-label="프로젝트 체크리스트">
              <div className="tag" style={{ color: 'var(--green)', marginBottom: 'var(--space-sm)' }}>✅ 프로젝트 체크리스트</div>
              {pm.checklist.map((item, i) => (
                <div key={i} style={{ fontSize: 13, color: 'var(--sec)', lineHeight: 1.7, marginBottom: 4, paddingLeft: 12, borderLeft: '2px solid var(--border)' }}>{i + 1}. {item}</div>
              ))}
            </div>
          )}
        </div>

        {/* ── Timeline ── */}
        <section className="card" style={{ marginBottom: 'var(--space-md)' }} aria-label="의사결정 타임라인">
          <div className="tag" style={{ color: 'var(--blue)', marginBottom: 10 }}>⏱ 의사결정 타임라인</div>
          <div className="timeline">
            <div className="timeline__line" />
            {state.hist.map((h, i) => {
              const gc = GC[h.g];
              return (
                <div className="timeline__item" key={i}>
                  <div className="timeline__dot" style={{ background: gc.color }} />
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>
                    STEP {i + 1} <span style={{ color: gc.color }}>{gc.emoji} {gc.label}</span>
                    {h.timedOut && <span style={{ color: 'var(--red)', marginLeft: 4 }}>⏱ 시간초과 −5</span>}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{h.t}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{h.q}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Share ── */}
        <div className="share-card" style={{ marginBottom: 'var(--space-md)' }}>
          <div className="tag" style={{ color: 'var(--blue)', marginBottom: 8 }}>🔗 결과 공유하기</div>
          <canvas ref={cardCanvasRef} style={{ width: '100%', maxWidth: 600, borderRadius: 12, marginBottom: 10, display: 'block' }} />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn--primary btn--sm" onClick={handleCopyText}>
              {copied ? '✓ 복사됨!' : '📋 텍스트 복사'}
            </button>
            <button className="btn btn--secondary btn--sm" onClick={handleSaveImage}>
              {imgSaved ? '✓ 저장됨!' : '🖼️ 이미지 저장'}
            </button>
          </div>
        </div>

        {/* ── Recommendations ── */}
        {pm.nextRec?.length > 0 && (
          <section style={{ marginBottom: 12 }} aria-label="추천 시나리오">
            <div className="tag" style={{ color: 'var(--blue)', marginBottom: 8 }}>🎯 다음에 도전해보세요</div>
            {pm.nextRec.map((rec, i) => {
              const recSc = SCENARIOS.find(s => s.id === rec.id);
              if (!recSc) return null;
              const recDone = completed[rec.id];
              return (
                <Link key={i} to={`/scenario/${rec.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="card card--sm" style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                    <span style={{ fontSize: 20 }} aria-hidden="true">{recSc.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{recSc.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--sec)' }}>{rec.reason}</div>
                    </div>
                    {recDone ? (
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--green)' }}>{recDone.pct}% ✓</span>
                    ) : (
                      <span style={{ color: 'var(--blue)', fontSize: 14 }}>→</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </section>
        )}

        {pm.interviewQs?.length > 0 && <InterviewPractice sc={sc} pm={pm} />}
        {pm.codeChallenge && <CodeChallenge sc={sc} pm={pm} />}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
          <button className="btn btn--secondary" onClick={onRestart}>다시 하기</button>
          <button className="btn btn--primary" onClick={() => navigate('/')}>다른 시나리오</button>
        </div>
      </div>
    </main>
  );
}
