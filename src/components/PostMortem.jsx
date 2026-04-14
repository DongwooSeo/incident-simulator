import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SCENARIOS } from '../data/scenarios';
import { GC } from '../utils/constants';
import { useCompleted } from './CompletedContext';

export default function PostMortem({ sc, state, onRestart }) {
  const navigate = useNavigate();
  const { completed, saveCompleted } = useCompleted();
  const [copied, setCopied] = useState(false);
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
      saveCompleted({ ...completed, [sc.id]: { score: state.score, maxS, pct, cat: sc.cat, date: new Date().toLocaleDateString() } });
    }
  }, [sc.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
          <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 16, marginBottom: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>INCIDENT SIMULATOR</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{sc.icon} {sc.title}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, color: sColor, marginBottom: 2 }}>{pct}%</div>
            <div style={{ fontSize: 12, color: 'var(--sec)' }}>{comment}</div>
          </div>
          <button
            className="btn btn--primary btn--sm"
            onClick={() => {
              const text = `[INCIDENT SIMULATOR] ${sc.icon} ${sc.title}\n점수: ${state.score}/${maxS} (${pct}%)\n${comment}\n\n#현업시뮬레이션 #백엔드 #MSA`;
              navigator.clipboard?.writeText(text).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              });
            }}
          >
            {copied ? '✓ 복사됨!' : '텍스트 복사'}
          </button>
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

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
          <button className="btn btn--secondary" onClick={onRestart}>다시 하기</button>
          <button className="btn btn--primary" onClick={() => navigate('/')}>다른 시나리오</button>
        </div>
      </div>
    </main>
  );
}
