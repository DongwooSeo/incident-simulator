import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { GC } from '../utils/constants';
import { bold } from '../utils/helpers';

function stepsToEnd(nodes, nodeId, visited = new Set()) {
  if (!nodeId || !nodes[nodeId] || nodes[nodeId].type === 'end' || visited.has(nodeId)) return 0;
  visited.add(nodeId);
  const choices = nodes[nodeId].ch;
  if (!choices?.length) return 1;
  const paths = choices.map(c => stepsToEnd(nodes, c.nx, new Set(visited)));
  return 1 + Math.min(...paths);
}

function mentorPhaseGuide(phase) {
  const p = phase || 'investigate';
  if (p === 'investigate') {
    return '단계 성격: 원인 파악(Investigate). 로그·메트릭·트레이스·아키텍처 단서를 연결해 가설을 세우도록 유도하세요.';
  }
  if (p === 'postmortem') {
    return '단계 성격: 재발 방지·프로세스(Post-incident). 기술만이 아니라 Runbook, 모니터링, 부하 테스트, 배포 안전장치, 팀 협업 우선순위를 논의하도록 유도하세요.';
  }
  return '단계 성격: 긴급 완화(Mitigate). SLA·시간 제약·배포/롤백 가능 여부 안에서 피해를 줄이는 현실적 조치를 논의하세요. 완벽한 설계보다 복구·고객 영향 최소화가 우선입니다.';
}

function buildMentorUserContent(sc, node, cluesSummary, history) {
  return `${mentorPhaseGuide(node.phase)}

현재 시나리오: ${sc.title}
상황: ${node.title} (${node.time})
질문: ${node.q}
${cluesSummary}

대화 기록:
${history}

멘토 규칙:
1. 정답을 직접 알려주지 마세요. 학생이 스스로 깨닫도록 질문으로 유도하세요.
2. 학생의 사고 과정에서 좋은 점을 먼저 짚어주세요.
3. 놓치고 있는 관점이 있다면 힌트성 질문을 던져주세요.
4. 2~3문장으로 간결하게 답하세요. 마크다운 사용하지 마세요.
5. 한국어로 답변하세요.`;
}

export default function ScenarioPlay({ sc, node, state, dispatch }) {
  const timerRef = useRef(null);
  const nudgeRef = useRef(null);
  const chatEndRef = useRef(null);
  const stepNum = state.hist.length + 1;
  const totalSteps = state.hist.length + stepsToEnd(sc.nodes, state.nodeId);

  /* ── Timer ── */
  useEffect(() => {
    if (node.timer && !node.type) dispatch({ type: 'INIT_TIMER', time: node.timer });
    return () => clearInterval(timerRef.current);
  }, [node]);

  useEffect(() => {
    clearInterval(timerRef.current);
    if (state.timerActive && state.timer > 0 && !state.revealed) {
      timerRef.current = setInterval(() => dispatch({ type: 'TICK' }), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [state.timerActive, state.revealed]);

  useEffect(() => () => clearTimeout(nudgeRef.current), []);

  /* ── Chat auto-scroll ── */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.chatMessages]);

  /* ── AI Chat ── */
  const handleChatSend = async () => {
    const isFirst = state.chatMessages.length === 0;
    const text = isFirst ? state.freeText : state.chatInput;
    if (!text.trim() || state.chatLoading) return;
    if (state.chatMessages.filter(m => m.role === 'user').length >= 3) {
      dispatch({ type: 'SHOW_CHOICES' }); return;
    }

    const userMsg = { role: 'user', content: text };
    const newMsgs = [...state.chatMessages, userMsg];
    dispatch({ type: 'ADD_MSG', msg: userMsg, clearFree: isFirst, clearInput: !isFirst });
    dispatch({ type: 'CHAT_LOADING', v: true });

    try {
      const cluesSummary = Object.keys(state.cluesRevealed).length > 0
        ? '학생이 확인한 정보: ' + Object.keys(state.cluesRevealed).join(', ')
        : '학생이 아직 추가 정보를 확인하지 않았습니다.';

      const history = newMsgs.map(m => `${m.role === 'user' ? '학생' : '멘토'}: ${m.content}`).join('\n');

      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 600,
          messages: [{
            role: 'user',
            content: buildMentorUserContent(sc, node, cluesSummary, history),
          }],
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error?.message || `서버 오류 (${resp.status})`);
      }
      const data = await resp.json();
      const aiText = data.content?.map(c => c.text || '').join('') || '피드백을 생성하지 못했습니다.';
      dispatch({ type: 'ADD_MSG', msg: { role: 'assistant', content: aiText } });
    } catch (e) {
      dispatch({ type: 'ADD_MSG', msg: { role: 'assistant', content: `AI 멘토 연결 실패: ${e.message}. 건너뛰기로 선택지를 확인할 수 있습니다.` } });
    }

    dispatch({ type: 'CHAT_LOADING', v: false });

    const userCount = newMsgs.filter(m => m.role === 'user').length;
    if (userCount >= 2) {
      nudgeRef.current = setTimeout(() => dispatch({ type: 'ADD_MSG', msg: { role: 'assistant', content: '좋은 고민이었습니다! 이제 선택지를 보고 최종 판단을 내려보세요. 위의 \'대화 마치고 선택지 보기\' 버튼을 눌러주세요.' } }), 1500);
    }
  };

  const confirm = () => {
    if (!state.sel || state.revealed) return;
    dispatch({ type: 'CONFIRM', choices: node.ch, q: node.q });
  };

  const goNext = () => {
    const ch = node.ch.find(c => c.id === state.sel);
    dispatch({ type: 'GO_NODE', nodeId: ch.nx });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasClues = !!node.clues;
  const hasFreeFirst = !!node.freeFirst;
  const clueCount = Object.keys(state.cluesRevealed).length;
  const minClues = hasClues ? (node.minClues ?? 2) : 0;
  const cluesMet = clueCount >= minClues;
  const shouldShowChoices = (!hasFreeFirst || state.showChoices) && cluesMet;

  return (
    <main className="page">
      <div className="container">
        {/* ── Header ── */}
        <div className="step-header">
          <span className="tag" style={{ color: 'var(--blue)', background: 'var(--blue-dark)' }}>STEP {String(stepNum).padStart(2, '0')}</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>{node.title} — {node.time}</span>
          {state.timerActive && state.timer > 0 && !state.revealed && (
            <span aria-live="polite" style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 13, color: state.timer <= 10 ? 'var(--red)' : 'var(--yellow)', fontWeight: 700, animation: state.timer <= 10 ? 'pulse 0.5s infinite' : 'none' }}>⏱ {state.timer}s</span>
          )}
          {state.timerExpired && !state.revealed && (
            <span aria-live="assertive" style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--red)', animation: 'pulse 1s infinite' }}>⏱ 시간 초과! (−5점)</span>
          )}
          <Link to="/" style={{ marginLeft: state.timerActive ? 0 : 'auto', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', textDecoration: 'none' }}>← 홈</Link>
        </div>

        {/* ── Progress bar ── */}
        <div className="progress" style={{ marginBottom: 16 }}>
          <div className="progress__fill" style={{ width: `${totalSteps ? (stepNum / totalSteps) * 100 : 0}%`, background: sc.clr }} />
        </div>

        {/* ── Narrative ── */}
        <section className="narrative" style={{ marginBottom: 12 }}>
          {node.nar.map((l, i) => <p key={i}>{bold(l)}</p>)}
        </section>

        {/* ── Alerts ── */}
        {node.alerts && (
          <div className="terminal" style={{ marginBottom: 10 }} role="log" aria-label="시스템 알림">
            <div style={{ padding: 12, fontFamily: 'var(--mono)', fontSize: 12, lineHeight: 1.7 }}>
              {node.alerts.map((a, i) => (
                <div key={i}>
                  {a.level === 'critical' ? '🚨' : '⚠️'}{' '}
                  <span style={{ color: a.level === 'critical' ? 'var(--red)' : 'var(--yellow)', fontWeight: 600 }}>[{a.level.toUpperCase()}]</span>{' '}
                  <span style={{ color: 'var(--sec)' }}>{a.msg}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Slack Message ── */}
        {node.slack && (
          <div className="slack" style={{ marginBottom: 10 }}>
            <div className="slack__header">
              <div className="slack__avatar" style={{ background: 'rgba(59,130,246,0.15)' }}>👤</div>
              <span className="slack__name">{node.slack.name}</span>
              <span className="slack__time">{node.slack.time}</span>
              <span className="slack__channel">#incident</span>
            </div>
            <div className="slack__body">{bold(node.slack.body)}</div>
          </div>
        )}

        {/* ── Timer Expired CTO ── */}
        {state.timerExpired && !state.revealed && (
          <div className="slack" style={{ marginBottom: 10, background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.2)' }}>
            <div className="slack__header">
              <div className="slack__avatar" style={{ background: 'rgba(239,68,68,0.15)' }}>🔴</div>
              <span className="slack__name" style={{ color: 'var(--red)' }}>CTO 박서연</span>
              <span className="slack__time">방금</span>
              <span className="slack__channel" style={{ color: 'var(--red)', background: 'rgba(239,68,68,0.1)' }}>#incident</span>
            </div>
            <div className="slack__body" style={{ color: 'var(--red)' }}>
              아직 결정이 안 된 건가요? 시간이 계속 흐르고 있습니다. 빨리 판단해주세요!
            </div>
          </div>
        )}

        {/* ── Metrics ── */}
        {node.met && (
          <div className="metric-grid" style={{ marginBottom: 10 }}>
            {node.met.map((m, i) => (
              <div className="metric-card" key={i}>
                <div className="metric-card__label">{m.l}</div>
                <div className="metric-card__value" style={{ color: m.s === 'danger' ? 'var(--red)' : m.s === 'warning' ? 'var(--yellow)' : 'var(--green)' }}>{m.v}</div>
                {m.u && <div className="metric-card__sub">{m.u}</div>}
              </div>
            ))}
          </div>
        )}

        {/* ── Clues ── */}
        {hasClues && (
          <section style={{ marginBottom: 16 }} aria-label="단서 탐색">
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>🔎 {node.clues.prompt}</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
              {node.clues.options.map(opt => (
                <button key={opt.id} className={`clue-btn ${state.cluesRevealed[opt.id] ? 'clue-btn--active' : ''}`} onClick={() => dispatch({ type: 'REVEAL_CLUE', id: opt.id })}>
                  {opt.label}
                </button>
              ))}
            </div>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: cluesMet ? 'var(--green)' : 'var(--yellow)', marginBottom: 10 }} role="status">
              {cluesMet ? `✓ ${clueCount}개 확인 완료 — 선택지가 열렸습니다` : `⚠ 최소 ${minClues}개 이상 확인해야 선택지가 열립니다 (현재 ${clueCount}/${minClues})`}
            </p>

            {node.clues.options.map(opt => state.cluesRevealed[opt.id] && (
              <div key={opt.id} style={{ animation: 'fadeIn .3s ease', marginBottom: 8 }}>
                {opt.content && (
                  <div className="terminal">
                    <div className="terminal__bar">
                      {['#ff5f56', '#ffbd2e', '#27c93f'].map((c, j) => <span key={j} className="terminal__dot" style={{ background: c }} />)}
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginLeft: 6 }}>{opt.label}</span>
                    </div>
                    <div className="terminal__body">
                      {opt.content.map((l, j) => (
                        <div key={j}>
                          {l.t && <span style={{ color: 'var(--muted)' }}>{l.t} </span>}
                          <span style={{ color: l.lv === 'error' ? 'var(--red)' : l.lv === 'warn' ? 'var(--yellow)' : 'var(--muted)', fontWeight: 600 }}>{l.lv?.toUpperCase()} </span>
                          <span style={{ color: l.lv === 'error' ? 'var(--red)' : '#4ade80' }}>{l.m}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {opt.metrics && (
                  <div className="metric-grid">
                    {opt.metrics.map((m, j) => (
                      <div className="metric-card" key={j}>
                        <div className="metric-card__label">{m.l}</div>
                        <div className="metric-card__value" style={{ color: m.s === 'danger' ? 'var(--red)' : m.s === 'warning' ? 'var(--yellow)' : 'var(--green)' }}>{m.v}</div>
                        {m.u && <div className="metric-card__sub">{m.u}</div>}
                      </div>
                    ))}
                  </div>
                )}
                {opt.trace && (
                  <div className="terminal">
                    <div className="terminal__bar">
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{opt.trace.title}</span>
                    </div>
                    <div className="terminal__body" style={{ lineHeight: 2 }}>
                      {opt.trace.lines.map((l, j) => (
                        <div key={j} style={{ paddingLeft: l.indent * 20 }}>
                          <span style={{ color: 'var(--muted)' }}>{l.indent > 0 ? '├─ ' : ''}</span>
                          <span style={{ color: ({ ok: 'var(--green)', warn: 'var(--yellow)', error: 'var(--red)' })[l.status] || 'var(--text)' }}>{l.text}</span>
                          {l.time && <span style={{ color: ({ ok: 'var(--green)', warn: 'var(--yellow)', error: 'var(--red)' })[l.status], fontWeight: 600 }}> {l.time}</span>}
                          {l.note && <span style={{ color: 'var(--red)', fontWeight: 700 }}> {l.note}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {/* ── Free Response + AI Chat ── */}
        {hasFreeFirst && !state.freeSubmitted && (
          <section className="chat-area" style={{ marginBottom: 16 }} aria-label="자유 응답">
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>✍️ 먼저 생각해보세요</h3>
            <p style={{ fontSize: 13, color: 'var(--sec)', marginBottom: 12 }}>{node.freeFirst}</p>

            {state.chatMessages.length > 0 && (
              <div className="chat-messages" role="log" aria-label="멘토 대화">
                {state.chatMessages.map((msg, i) => (
                  <div key={i} className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble--user' : 'chat-bubble--ai'}`}>
                    {msg.role === 'assistant' && <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--blue)', marginBottom: 4, fontWeight: 600 }}>🤖 AI 멘토</div>}
                    {msg.content}
                  </div>
                ))}
                {state.chatLoading && (
                  <div className="chat-bubble chat-bubble--ai"><span style={{ animation: 'pulse 1s infinite' }}>AI 멘토가 생각하는 중...</span></div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}

            <textarea
              className="chat-input"
              value={state.chatMessages.length === 0 ? state.freeText : state.chatInput}
              onChange={e => dispatch({ type: state.chatMessages.length === 0 ? 'SET_FREE' : 'SET_CHAT_INPUT', text: e.target.value })}
              placeholder={state.chatMessages.length === 0 ? '본인의 생각을 자유롭게 적어보세요...' : '추가 질문이나 생각을 적어보세요...'}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
              aria-label="답변 입력"
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  className="btn btn--primary btn--sm"
                  disabled={state.chatLoading || !(state.chatMessages.length === 0 ? state.freeText.trim() : state.chatInput.trim())}
                  onClick={handleChatSend}
                >
                  {state.chatMessages.length === 0 ? 'AI에게 내 생각 보내기' : '추가 질문하기'}
                </button>
                {state.chatMessages.length > 0 && (
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
                    {state.chatMessages.filter(m => m.role === 'user').length}/3회 대화
                  </span>
                )}
              </div>
              <button className="btn btn--ghost" onClick={() => dispatch({ type: 'SHOW_CHOICES' })}>
                {state.chatMessages.length > 0 ? '대화 마치고 선택지 보기 →' : '건너뛰기'}
              </button>
            </div>
          </section>
        )}

        {/* ── Choices ── */}
        {shouldShowChoices && (
          <section style={{ marginTop: 16 }} aria-label="선택지">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>🎯 {node.q}</h3>

            {node.hint && (
              <div style={{ marginBottom: 12 }}>
                <button className="hint-btn" onClick={() => dispatch({ type: 'TOGGLE_HINT' })}>
                  {state.showHint ? '💡 힌트 숨기기' : '💡 힌트 (초급자용)'}
                </button>
                {state.showHint && <div className="hint-box">{node.hint}</div>}
              </div>
            )}

            <div role="radiogroup" aria-label="선택지">
              {node.ch.map(ch => {
                const gc = state.revealed ? GC[ch.g] : null;
                const isSel = state.sel === ch.id;
                return (
                  <div
                    key={ch.id}
                    role="radio"
                    aria-checked={isSel}
                    tabIndex={0}
                    className={`choice ${isSel ? 'choice--selected' : ''} ${state.revealed ? 'choice--revealed' : ''} ${state.revealed && !isSel ? 'choice--dimmed' : ''}`}
                    style={gc ? { background: `${gc.color}08`, borderColor: `${gc.color}40` } : undefined}
                    onClick={() => !state.revealed && dispatch({ type: 'SELECT', id: ch.id })}
                    onKeyDown={e => e.key === 'Enter' && !state.revealed && dispatch({ type: 'SELECT', id: ch.id })}
                  >
                    <div className="choice__id" style={gc ? { color: gc.color } : { color: 'var(--blue)' }}>
                      {state.revealed && isSel ? `${gc.emoji} ${ch.id} — 당신의 선택` : ch.id}
                      {state.revealed && gc && <span className="sr-only">{gc.label}</span>}
                    </div>
                    <div className="choice__title">{ch.text}</div>
                    <div className="choice__desc">{ch.desc}</div>
                    {state.revealed && ch.impact && (
                      <div className="choice__impact">
                        {Object.entries(ch.impact).map(([k, v]) => (
                          <span key={k} style={isSel ? { background: 'rgba(255,255,255,0.06)' } : undefined}>
                            {k}: <strong style={{ color: 'var(--text)' }}>{v}</strong>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {!state.revealed && state.sel && (
              <button className="btn btn--primary" style={{ marginTop: 10 }} onClick={confirm}>이 선택으로 확정</button>
            )}

            {/* ── Feedback ── */}
            {state.revealed && (() => {
              const ch = node.ch.find(c => c.id === state.sel);
              const fb = node.fb[state.sel];
              const gc = GC[ch.g];
              return (
                <>
                  <div className="feedback" style={{ background: `${gc.color}08`, border: `1px solid ${gc.color}40` }}>
                    <div className="feedback__title" style={{ color: gc.color }}>{fb.t}</div>
                    <div className="feedback__body">{bold(fb.b)}</div>
                    {fb.cost && (
                      <div style={{ marginTop: 10, padding: '10px 12px', background: 'rgba(234,179,8,0.06)', borderRadius: 6, border: '1px solid rgba(234,179,8,0.2)', fontSize: 13, color: 'var(--sec)', lineHeight: 1.65 }}>
                        <strong style={{ color: 'var(--yellow)' }}>숨은 비용 · 리스크:</strong> {bold(fb.cost)}
                      </div>
                    )}
                    {fb.r && (
                      <div className="feedback__ref">
                        💡 <strong style={{ color: 'var(--blue)' }}>현업:</strong> {fb.r}
                      </div>
                    )}
                  </div>

                  {node.tradeoff && (
                    <div className="tradeoff" style={{ marginTop: 14 }}>
                      <div className="tradeoff__header">📊 트레이드오프 비교</div>
                      <div className="tradeoff__scroll">
                        <table>
                          <thead>
                            <tr>
                              {['선택지', '소요시간', '리스크', '데이터 영향', '비고'].map(h => <th key={h}>{h}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {node.tradeoff.map((row, i) => (
                              <tr key={i}>
                                <td style={{ fontWeight: 600, color: 'var(--text)' }}>{row.option}</td>
                                <td>{row.time}</td>
                                <td style={{ color: ['높음', '매우 높음', '최대'].includes(row.risk) ? 'var(--red)' : row.risk === '중간' ? 'var(--yellow)' : 'var(--green)' }}>{row.risk}</td>
                                <td>{row.dataLoss}</td>
                                <td>{row.note}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <button className="btn btn--secondary" style={{ marginTop: 16 }} onClick={goNext}>다음 상황으로 →</button>
                </>
              );
            })()}
          </section>
        )}
      </div>
    </main>
  );
}
