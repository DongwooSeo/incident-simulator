import { Link } from 'react-router-dom';
import { SCENARIOS } from '../data/scenarios';
import { useCompleted } from './CompletedContext';

export default function Report() {
  const { completed, saveCompleted } = useCompleted();
  const totalDone = Object.keys(completed).length;
  const avgPct = totalDone > 0 ? Math.round(Object.values(completed).reduce((a, d) => a + d.pct, 0) / totalDone) : 0;

  const cats = {};
  Object.entries(completed).forEach(([, data]) => {
    if (!cats[data.cat]) cats[data.cat] = [];
    cats[data.cat].push(data);
  });
  const strongCats = Object.entries(cats).filter(([, items]) => items.every(d => d.pct >= 65)).map(([cat]) => cat);
  const weakCats = Object.entries(cats).filter(([, items]) => items.some(d => d.pct < 65)).map(([cat]) => cat);

  const scoreColor = avgPct >= 75 ? 'var(--green)' : avgPct >= 50 ? 'var(--yellow)' : 'var(--red)';

  return (
    <main className="page">
      <div className="container">
        <Link to="/" style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)', textDecoration: 'none' }}>← 홈으로</Link>

        <h1 style={{ fontSize: 22, fontWeight: 900, marginTop: 16, marginBottom: 4 }}>📊 역량 분석 리포트</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>완료한 시나리오: {totalDone} / {SCENARIOS.length}</p>

        <div className="card" style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 2, marginBottom: 4 }}>평균 점수</div>
          <div className="score-display" style={{ color: scoreColor }}>{avgPct}<span style={{ fontSize: 18 }}>%</span></div>
        </div>

        {strongCats.length > 0 && (
          <div className="card--sm" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '14px 18px', marginBottom: 10 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--green)', marginBottom: 6 }}>💪 강점 영역</div>
            <div style={{ fontSize: 13, color: 'var(--sec)' }}>{strongCats.join(', ')}</div>
          </div>
        )}

        {weakCats.length > 0 && (
          <div className="card--sm" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '14px 18px', marginBottom: 10 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--red)', marginBottom: 6 }}>📚 보완 필요 영역</div>
            <div style={{ fontSize: 13, color: 'var(--sec)' }}>{weakCats.join(', ')}</div>
          </div>
        )}

        <div style={{ marginTop: 16 }}>
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
