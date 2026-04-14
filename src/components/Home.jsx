import { Link } from 'react-router-dom';
import { SCENARIOS } from '../data/scenarios';
import { useCompleted } from './CompletedContext';

export default function Home() {
  const { completed } = useCompleted();
  const totalDone = Object.keys(completed).length;

  return (
    <main className="page">
      <div className="container container--wide">
        <header style={{ textAlign: 'center', marginBottom: 40 }}>
          <span className="tag" style={{ color: 'var(--blue)', background: 'var(--blue-dark)', marginBottom: 16 }}>
            ECOMMERCE INCIDENT SIMULATOR v2
          </span>
          <h1 style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.3, marginTop: 16, marginBottom: 12 }}>
            현업 장애 시뮬레이션
          </h1>
          <p style={{ fontSize: 14, color: 'var(--sec)', lineHeight: 1.7, maxWidth: 520, margin: '0 auto' }}>
            실제 이커머스에서 발생하는 기술적 문제를 직접 경험하세요.
          </p>
        </header>

        {totalDone > 0 && (
          <Link to="/report" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <div>
                <div className="tag" style={{ color: 'var(--blue)', marginBottom: 4 }}>📊 나의 역량 리포트</div>
                <div style={{ fontSize: 13, color: 'var(--sec)' }}>완료: {totalDone}/{SCENARIOS.length} 시나리오</div>
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 700, color: 'var(--blue)' }}>
                {Math.round(Object.values(completed).reduce((a, d) => a + d.pct, 0) / totalDone)}%
              </div>
            </div>
          </Link>
        )}

        <nav aria-label="시나리오 목록">
          <div style={{ display: 'grid', gap: 12 }}>
            {SCENARIOS.map((s, i) => {
              const done = completed[s.id];
              return (
                <Link key={s.id} to={`/scenario/${s.id}`} style={{ textDecoration: 'none', color: 'inherit', animationDelay: `${i * 0.05}s` }}>
                  <article
                    className="sc-card"
                    style={done ? { borderColor: 'rgba(34,197,94,0.2)' } : undefined}
                    aria-label={`${s.title} — ${s.cat}, ${s.diff}`}
                  >
                    <div className="sc-card__icon" style={{ background: `${s.clr}15` }}>
                      <span role="img" aria-hidden="true">{s.icon}</span>
                      {done && <span className="sc-card__check" aria-label="완료">✓</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="sc-card__meta">
                        <span className="tag" style={{ color: s.clr, background: `${s.clr}18` }}>{s.cat}</span>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{s.diff} · {s.dur}</span>
                        {done && <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--green)' }}>{done.pct}%</span>}
                      </div>
                      <h2 className="sc-card__title">{s.title}</h2>
                      <p className="sc-card__company">{s.company}</p>
                    </div>
                    <span style={{ color: 'var(--muted)', fontSize: 18 }} aria-hidden="true">{done ? '↻' : '→'}</span>
                  </article>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </main>
  );
}
