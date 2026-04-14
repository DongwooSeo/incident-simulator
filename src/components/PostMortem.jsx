import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SCENARIOS } from '../data/scenarios';
import { GC } from '../utils/constants';
import { useCompleted } from './CompletedContext';

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

  const [ivOpen, setIvOpen] = useState(false);
  const [ivMsgs, setIvMsgs] = useState([]);
  const [ivInput, setIvInput] = useState('');
  const [ivLoading, setIvLoading] = useState(false);
  const [ivQIdx, setIvQIdx] = useState(0);
  const ivEndRef = useRef(null);

  const [ccOpen, setCcOpen] = useState(false);
  const [ccCode, setCcCode] = useState('');
  const [ccMsgs, setCcMsgs] = useState([]);
  const [ccLoading, setCcLoading] = useState(false);
  const ccEndRef = useRef(null);
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
      saveCompleted({ ...completed, [sc.id]: { score: state.score, maxS, pct, cat: sc.cat, date: new Date().toLocaleDateString() } });
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

  useEffect(() => { ivEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [ivMsgs]);
  useEffect(() => { ccEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [ccMsgs]);

  const startInterview = () => {
    const q = pm.interviewQs?.[ivQIdx];
    if (!q) return;
    setIvOpen(true);
    setIvMsgs([{ role: 'assistant', content: `면접 질문입니다.\n\n"${q}"` }]);
  };

  const nextInterviewQ = () => {
    const next = ivQIdx + 1;
    if (next >= (pm.interviewQs?.length || 0)) return;
    setIvQIdx(next);
    setIvMsgs([{ role: 'assistant', content: `다음 질문입니다.\n\n"${pm.interviewQs[next]}"` }]);
    setIvInput('');
  };

  const sendIvAnswer = async () => {
    if (!ivInput.trim() || ivLoading) return;
    const userMsg = { role: 'user', content: ivInput };
    const newMsgs = [...ivMsgs, userMsg];
    setIvMsgs(newMsgs);
    setIvInput('');
    setIvLoading(true);
    try {
      const history = newMsgs.map(m => `${m.role === 'user' ? '지원자' : '면접관'}: ${m.content}`).join('\n');
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `당신은 이커머스 백엔드 시니어 개발자 면접관입니다.\n시나리오: ${sc.title}\n핵심 개념: ${sc.tags.join(', ')}\n근본 원인: ${pm.rc}\n\n대화 기록:\n${history}\n\n면접관 규칙:\n1. 지원자 답변에서 좋은 점을 먼저 짚어주세요.\n2. 부족하거나 틀린 부분이 있다면 구체적으로 피드백하세요.\n3. STAR 기법(Situation-Task-Action-Result)으로 답변 구조화를 유도하세요.\n4. 실제 면접에서 합격/불합격 수준인지 솔직히 평가하세요.\n5. 3~4문장으로 답하세요. 마크다운 사용하지 마세요.\n6. 한국어로 답변하세요.` }]
        })
      });
      if (!resp.ok) throw new Error(`서버 오류 (${resp.status})`);
      const data = await resp.json();
      const aiText = data.content?.map(c => c.text || '').join('') || '피드백을 생성하지 못했습니다.';
      setIvMsgs(prev => [...prev, { role: 'assistant', content: aiText }]);
    } catch (e) {
      setIvMsgs(prev => [...prev, { role: 'assistant', content: `AI 면접관 연결 실패: ${e.message}` }]);
    }
    setIvLoading(false);
  };

  const startCode = () => {
    setCcOpen(true);
    setCcCode(pm.codeChallenge?.starterCode || '');
    setCcMsgs([]);
  };

  const submitCode = async () => {
    if (!ccCode.trim() || ccLoading) return;
    const userMsg = { role: 'user', content: ccCode };
    setCcMsgs(prev => [...prev, userMsg]);
    setCcLoading(true);
    try {
      const ch = pm.codeChallenge;
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `당신은 이커머스 백엔드 시니어 개발자 코드 리뷰어입니다.\n시나리오: ${sc.title}\n과제: ${ch.prompt}\n힌트: ${ch.hint}\n\n지원자가 제출한 코드:\n${ccCode}\n\n리뷰 규칙:\n1. 코드에서 잘한 점을 먼저 짚어주세요.\n2. 버그, 엣지 케이스, 성능 이슈가 있다면 구체적으로 짚어주세요.\n3. 개선 방향을 제시하되, 정답 코드를 직접 작성하지는 마세요.\n4. 실제 PR 리뷰 톤으로 3~5문장 작성하세요.\n5. 한국어로 답변하세요. 마크다운 사용하지 마세요.` }]
        })
      });
      if (!resp.ok) throw new Error(`서버 오류 (${resp.status})`);
      const data = await resp.json();
      const aiText = data.content?.map(c => c.text || '').join('') || '리뷰를 생성하지 못했습니다.';
      setCcMsgs(prev => [...prev, { role: 'assistant', content: aiText }]);
    } catch (e) {
      setCcMsgs(prev => [...prev, { role: 'assistant', content: `AI 리뷰어 연결 실패: ${e.message}` }]);
    }
    setCcLoading(false);
  };

  return (
    <main className="page">
      <div className="container">
        {/* ── Score ── */}
        <section className="card" style={{ textAlign: 'center', marginBottom: 24 }} aria-label="종합 점수">
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 2, marginBottom: 5 }}>종합 점수</div>
          <div className="score-display" style={{ color: sColor }}>{state.score} / {maxS}</div>
          <p style={{ fontSize: 14, color: 'var(--sec)', marginTop: 5 }}>{comment}</p>
        </section>

        <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>📋 포스트모템</h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>{sc.company}</p>

        {/* ── Root cause ── */}
        <div className="card card--sm" style={{ marginBottom: 12 }}>
          <div className="tag" style={{ color: 'var(--blue)', marginBottom: 6 }}>근본 원인</div>
          <p style={{ fontSize: 14, color: 'var(--sec)', lineHeight: 1.7 }}>{pm.rc}</p>
        </div>

        {/* ── Q&A ── */}
        {pm.qa.map((qa, i) => (
          <div className="card card--sm" key={i} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)', marginBottom: 5 }}>Q. {qa.q}</div>
            <div style={{ fontSize: 13, color: 'var(--sec)', lineHeight: 1.7 }}>A. {qa.a}</div>
          </div>
        ))}

        {/* ── Checklist ── */}
        {pm.checklist && (
          <section className="card card--sm" style={{ marginBottom: 12 }} aria-label="프로젝트 체크리스트">
            <div className="tag" style={{ color: 'var(--green)', marginBottom: 8 }}>✅ 프로젝트 체크리스트 — 지금 바로 해보세요</div>
            {pm.checklist.map((item, i) => (
              <div key={i} style={{ fontSize: 13, color: 'var(--sec)', lineHeight: 1.7, marginBottom: 4, paddingLeft: 12, borderLeft: '2px solid var(--border)' }}>{i + 1}. {item}</div>
            ))}
          </section>
        )}

        {/* ── Timeline ── */}
        <section className="card card--sm" style={{ marginBottom: 12 }} aria-label="의사결정 타임라인">
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
        <div className="share-card" style={{ marginBottom: 12 }}>
          <div className="tag" style={{ color: 'var(--blue)', marginBottom: 8 }}>🔗 결과 공유하기</div>
          <canvas ref={cardCanvasRef} style={{ width: '100%', maxWidth: 600, borderRadius: 12, marginBottom: 10, display: 'block' }} />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn--primary btn--sm"
              onClick={() => {
                const text = `[INCIDENT SIMULATOR] ${sc.icon} ${sc.title}\n점수: ${state.score}/${maxS} (${pct}%)\n${comment}\n\n의사결정 타임라인:\n${state.hist.map((h, i) => `  ${i + 1}. ${GC[h.g].emoji} ${h.t}`).join('\n')}\n\n#현업시뮬레이션 #백엔드 #MSA`;
                navigator.clipboard?.writeText(text).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                });
              }}
            >
              {copied ? '✓ 복사됨!' : '📋 텍스트 복사'}
            </button>
            <button
              className="btn btn--secondary btn--sm"
              onClick={() => {
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
              }}
            >
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

        {/* ── Interview Practice ── */}
        {pm.interviewQs?.length > 0 && (
          <section className="card" style={{ marginBottom: 12, padding: '16px 20px' }} aria-label="면접 연습">
            <div className="tag" style={{ color: 'var(--purple, #a855f7)', marginBottom: 8 }}>🎤 면접 답변 연습</div>
            <p style={{ fontSize: 13, color: 'var(--sec)', marginBottom: 12, lineHeight: 1.6 }}>
              이 시나리오에서 배운 내용을 면접에서 어떻게 말할지 연습해보세요. AI 면접관이 피드백을 드립니다.
            </p>
            {!ivOpen ? (
              <button className="btn btn--primary btn--sm" onClick={startInterview}>면접 연습 시작</button>
            ) : (
              <>
                <div className="chat-messages" role="log" aria-label="면접 대화" style={{ maxHeight: 360, overflowY: 'auto', marginBottom: 10 }}>
                  {ivMsgs.map((msg, i) => (
                    <div key={i} className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble--user' : 'chat-bubble--ai'}`}>
                      {msg.role === 'assistant' && <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--purple, #a855f7)', marginBottom: 4, fontWeight: 600 }}>🎤 AI 면접관</div>}
                      {msg.content}
                    </div>
                  ))}
                  {ivLoading && <div className="chat-bubble chat-bubble--ai"><span style={{ animation: 'pulse 1s infinite' }}>면접관이 평가하는 중...</span></div>}
                  <div ref={ivEndRef} />
                </div>
                <textarea
                  className="chat-input"
                  value={ivInput}
                  onChange={e => setIvInput(e.target.value)}
                  placeholder="면접 답변을 작성하세요... (STAR 기법: 상황-과제-행동-결과)"
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendIvAnswer(); } }}
                  aria-label="면접 답변 입력"
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button className="btn btn--primary btn--sm" disabled={ivLoading || !ivInput.trim()} onClick={sendIvAnswer}>답변 제출</button>
                  {ivQIdx < (pm.interviewQs?.length || 0) - 1 && ivMsgs.length > 1 && (
                    <button className="btn btn--ghost" onClick={nextInterviewQ}>다음 질문 →</button>
                  )}
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
                    질문 {ivQIdx + 1}/{pm.interviewQs.length}
                  </span>
                </div>
              </>
            )}
          </section>
        )}

        {/* ── Code Challenge ── */}
        {pm.codeChallenge && (
          <section className="card" style={{ marginBottom: 12, padding: '16px 20px' }} aria-label="코드 챌린지">
            <div className="tag" style={{ color: 'var(--green)', marginBottom: 8 }}>💻 코드 챌린지</div>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{pm.codeChallenge.title}</p>
            <p style={{ fontSize: 13, color: 'var(--sec)', marginBottom: 8, lineHeight: 1.6 }}>{pm.codeChallenge.prompt}</p>
            <p style={{ fontSize: 12, color: 'var(--yellow)', marginBottom: 12 }}>💡 힌트: {pm.codeChallenge.hint}</p>
            {!ccOpen ? (
              <button className="btn btn--primary btn--sm" onClick={startCode}>코드 작성 시작</button>
            ) : (
              <>
                <textarea
                  className="chat-input"
                  value={ccCode}
                  onChange={e => setCcCode(e.target.value)}
                  style={{ fontFamily: 'var(--mono)', fontSize: 12, minHeight: 180, whiteSpace: 'pre', tabSize: 2 }}
                  aria-label="코드 입력"
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                  <button className="btn btn--primary btn--sm" disabled={ccLoading || !ccCode.trim()} onClick={submitCode}>AI 코드 리뷰 요청</button>
                  {ccLoading && <span style={{ fontSize: 12, color: 'var(--muted)', animation: 'pulse 1s infinite' }}>리뷰 중...</span>}
                </div>
                {ccMsgs.length > 0 && (
                  <div className="chat-messages" role="log" aria-label="코드 리뷰" style={{ maxHeight: 300, overflowY: 'auto', marginTop: 10 }}>
                    {ccMsgs.map((msg, i) => (
                      msg.role === 'assistant' && (
                        <div key={i} className="chat-bubble chat-bubble--ai">
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--green)', marginBottom: 4, fontWeight: 600 }}>💻 AI 코드 리뷰어</div>
                          {msg.content}
                        </div>
                      )
                    ))}
                    <div ref={ccEndRef} />
                  </div>
                )}
              </>
            )}
          </section>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
          <button className="btn btn--secondary" onClick={onRestart}>다시 하기</button>
          <button className="btn btn--primary" onClick={() => navigate('/')}>다른 시나리오</button>
        </div>
      </div>
    </main>
  );
}
