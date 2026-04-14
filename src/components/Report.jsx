import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SCENARIOS } from '../data/scenarios';
import { useCompleted } from './CompletedContext';

const ALL_CATS = [...new Set(SCENARIOS.map(s => s.cat))];

function drawRadarChart(canvas, catScores) {
  const SIZE = 280, CENTER = SIZE / 2, R = SIZE / 2 - 40;
  canvas.width = SIZE * 2; canvas.height = SIZE * 2;
  canvas.style.width = `${SIZE}px`; canvas.style.height = `${SIZE}px`;
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);

  const cats = Object.keys(catScores);
  const n = cats.length;
  if (n < 3) return;
  const step = (Math.PI * 2) / n;

  const point = (i, r) => ({
    x: CENTER + r * Math.sin(i * step),
    y: CENTER - r * Math.cos(i * step),
  });

  [0.25, 0.5, 0.75, 1].forEach(s => {
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const p = point(i % n, R * s);
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  for (let i = 0; i < n; i++) {
    const p = point(i, R);
    ctx.beginPath();
    ctx.moveTo(CENTER, CENTER);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.stroke();
  }

  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const val = catScores[cats[i % n]] / 100;
    const p = point(i % n, R * Math.max(val, 0.05));
    i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(59,130,246,0.2)';
  ctx.fill();
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.stroke();

  for (let i = 0; i < n; i++) {
    const val = catScores[cats[i]] / 100;
    const p = point(i, R * Math.max(val, 0.05));
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = val >= 0.75 ? '#22c55e' : val >= 0.5 ? '#eab308' : '#ef4444';
    ctx.fill();
  }

  ctx.font = '600 11px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center';
  for (let i = 0; i < n; i++) {
    const labelR = R + 24;
    const p = point(i, labelR);
    ctx.fillStyle = '#8896b3';
    ctx.fillText(cats[i], p.x, p.y + 4);
  }
}

export default function Report() {
  const { completed, saveCompleted } = useCompleted();
  const radarRef = useRef(null);
  const totalDone = Object.keys(completed).length;
  const avgPct = totalDone > 0 ? Math.round(Object.values(completed).reduce((a, d) => a + d.pct, 0) / totalDone) : 0;

  const cats = {};
  Object.entries(completed).forEach(([, data]) => {
    if (!cats[data.cat]) cats[data.cat] = [];
    cats[data.cat].push(data);
  });
  const catScores = {};
  ALL_CATS.forEach(cat => {
    const items = cats[cat];
    catScores[cat] = items ? Math.round(items.reduce((a, d) => a + d.pct, 0) / items.length) : 0;
  });

  const strongCats = Object.entries(cats).filter(([, items]) => items.every(d => d.pct >= 65)).map(([cat]) => cat);
  const weakCats = Object.entries(cats).filter(([, items]) => items.some(d => d.pct < 65)).map(([cat]) => cat);
  const untriedCats = ALL_CATS.filter(cat => !cats[cat]);

  const weakRecs = SCENARIOS.filter(s => {
    const d = completed[s.id];
    return (d && d.pct < 65) || !d;
  }).filter(s => weakCats.includes(s.cat) || untriedCats.includes(s.cat)).slice(0, 3);

  const scoreColor = avgPct >= 75 ? 'var(--green)' : avgPct >= 50 ? 'var(--yellow)' : 'var(--red)';
  const interviewReady = totalDone >= 5 && avgPct >= 65;
  const interviewComment = totalDone === 0
    ? '시나리오를 완료하면 면접 준비도가 표시됩니다.'
    : interviewReady
      ? '핵심 시나리오를 높은 점수로 완료했습니다. 면접에서 경험을 자신있게 이야기할 수 있습니다!'
      : totalDone < 5
        ? `아직 ${5 - totalDone}개 더 완료하면 기본 면접 준비가 됩니다.`
        : '점수가 65% 미만인 시나리오를 다시 도전해보세요.';

  useEffect(() => {
    if (radarRef.current && totalDone >= 3) {
      drawRadarChart(radarRef.current, catScores);
    }
  }, [completed]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="page">
      <div className="container">
        <Link to="/" className="back-nav">← 홈으로</Link>

        <h1 style={{ fontSize: 22, fontWeight: 900, marginTop: 'var(--space-md)', marginBottom: 4 }}>📊 역량 분석 리포트</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 'var(--space-lg)' }}>완료한 시나리오: {totalDone} / {SCENARIOS.length}</p>

        {totalDone === 0 && (
          <div className="empty-state">
            <div className="empty-state__icon">🎯</div>
            <div className="empty-state__title">아직 완료한 시나리오가 없습니다</div>
            <div className="empty-state__desc">시나리오를 완료하면 여기에 역량 분석 리포트가 표시됩니다. 로드맵 순서대로 시작해보세요!</div>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <button className="btn btn--primary btn--sm" style={{ marginTop: 'var(--space-md)' }}>시나리오 둘러보기 →</button>
            </Link>
          </div>
        )}

        <div className="card" style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 2, marginBottom: 4 }}>평균 점수</div>
          <div className="score-display" style={{ color: scoreColor }}>{avgPct}<span style={{ fontSize: 18 }}>%</span></div>

          <div className="report-stats">
            <div className="report-stat">
              <div className="report-stat__value">{totalDone}</div>
              <div className="report-stat__label">완료</div>
            </div>
            <div className="report-stat">
              <div className="report-stat__value">{SCENARIOS.length - totalDone}</div>
              <div className="report-stat__label">남은 시나리오</div>
            </div>
            <div className="report-stat">
              <div className="report-stat__value" style={{ color: interviewReady ? 'var(--green)' : 'var(--yellow)' }}>
                {interviewReady ? 'Ready' : 'Not Yet'}
              </div>
              <div className="report-stat__label">면접 준비</div>
            </div>
          </div>
        </div>

        {/* ── Radar Chart ── */}
        {totalDone >= 3 && (
          <div className="card" style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 1, marginBottom: 12 }}>카테고리별 역량</div>
            <canvas ref={radarRef} style={{ margin: '0 auto', display: 'block' }} />
            <div className="radar-legend">
              {ALL_CATS.map(cat => (
                <div key={cat} className="radar-legend__item">
                  <span className="radar-legend__dot" style={{ background: (catScores[cat] || 0) >= 75 ? 'var(--green)' : (catScores[cat] || 0) >= 50 ? 'var(--yellow)' : catScores[cat] > 0 ? 'var(--red)' : 'var(--muted)' }} />
                  <span>{cat}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: catScores[cat] > 0 ? 'var(--text)' : 'var(--muted)' }}>{catScores[cat] || '-'}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Interview Readiness ── */}
        <div className="card card--sm" style={{ marginBottom: 16, background: interviewReady ? 'rgba(34,197,94,0.06)' : 'rgba(234,179,8,0.06)', border: `1px solid ${interviewReady ? 'rgba(34,197,94,0.2)' : 'rgba(234,179,8,0.2)'}` }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: interviewReady ? 'var(--green)' : 'var(--yellow)', marginBottom: 6 }}>🎤 면접 준비도</div>
          <div style={{ fontSize: 13, color: 'var(--sec)', lineHeight: 1.6 }}>{interviewComment}</div>
          {totalDone > 0 && (
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {[
                { label: '시나리오 5개+', ok: totalDone >= 5 },
                { label: '평균 65%+', ok: avgPct >= 65 },
                { label: '3개 카테고리+', ok: Object.keys(cats).length >= 3 },
              ].map((item, i) => (
                <span key={i} style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '3px 8px', borderRadius: 4, background: item.ok ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)', color: item.ok ? 'var(--green)' : 'var(--muted)', border: `1px solid ${item.ok ? 'rgba(34,197,94,0.2)' : 'var(--border)'}` }}>
                  {item.ok ? '✓' : '○'} {item.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {strongCats.length > 0 && (
          <div className="card--sm" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '14px 18px', marginBottom: 10 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--green)', marginBottom: 6 }}>💪 강점 영역</div>
            <div style={{ fontSize: 13, color: 'var(--sec)' }}>{strongCats.join(', ')}</div>
          </div>
        )}

        {(weakCats.length > 0 || untriedCats.length > 0) && (
          <div className="card--sm" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '14px 18px', marginBottom: 10 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--red)', marginBottom: 6 }}>📚 보완 필요 영역</div>
            <div style={{ fontSize: 13, color: 'var(--sec)' }}>
              {[...weakCats, ...untriedCats.map(c => `${c} (미시도)`)].join(', ')}
            </div>
          </div>
        )}

        {/* ── Weak Area Recommendations ── */}
        {weakRecs.length > 0 && (
          <section style={{ marginTop: 12, marginBottom: 16 }}>
            <div className="tag" style={{ color: 'var(--blue)', marginBottom: 8 }}>🎯 이 시나리오를 보완하세요</div>
            {weakRecs.map(s => {
              const d = completed[s.id];
              return (
                <Link key={s.id} to={`/scenario/${s.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="card card--sm" style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                    <span style={{ fontSize: 18 }}>{s.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{s.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {d ? `${d.pct}% — 다시 도전하면 점수를 올릴 수 있습니다` : `${s.cat} · ${s.diff}`}
                      </div>
                    </div>
                    <span style={{ color: 'var(--blue)', fontSize: 14 }}>→</span>
                  </div>
                </Link>
              );
            })}
          </section>
        )}

        <div style={{ marginTop: 16 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>전체 시나리오</div>
          {SCENARIOS.map((s) => {
            const d = completed[s.id];
            return (
              <Link key={s.id} to={`/scenario/${s.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 18 }} aria-hidden="true">{s.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.cat}</div>
                  </div>
                  {d ? (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: d.pct >= 75 ? 'var(--green)' : d.pct >= 50 ? 'var(--yellow)' : 'var(--red)' }}>{d.pct}%</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{d.date}</div>
                    </div>
                  ) : (
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>미완료</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {totalDone > 0 && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <button className="btn btn--danger" onClick={() => { saveCompleted({}); }}>
              진행 기록 초기화
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
