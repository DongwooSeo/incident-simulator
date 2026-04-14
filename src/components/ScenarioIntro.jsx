import { Link } from 'react-router-dom';

export default function ScenarioIntro({ sc, onStart }) {
  return (
    <main className="page">
      <div className="container" style={{ maxWidth: 600 }}>
        <Link to="/" style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)', textDecoration: 'none' }}>← 홈으로</Link>

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }} role="img" aria-label={sc.cat}>{sc.icon}</div>
          <span className="tag" style={{ color: sc.clr, background: `${sc.clr}18`, marginBottom: 12 }}>{sc.cat} · {sc.diff}</span>
          <h1 style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.35, marginTop: 12, marginBottom: 12 }}>{sc.title}</h1>
          <p style={{ fontSize: 14, color: 'var(--sec)', lineHeight: 1.7, marginBottom: 8 }}>{sc.company}</p>
        </div>

        <section className="card" style={{ marginTop: 28, marginBottom: 16 }} aria-label="역할 안내">
          <div className="tag" style={{ color: 'var(--blue)', marginBottom: 10 }}>🎭 당신의 역할</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{sc.role}</div>
          <div style={{ fontSize: 14, color: 'var(--sec)', lineHeight: 1.75 }}>{sc.brief}</div>
        </section>

        {sc.why && (
          <section style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, padding: '16px 20px', marginBottom: 16 }} aria-label="학습 이유">
            <div className="tag" style={{ color: 'var(--red)', marginBottom: 6 }}>🔥 왜 이 시나리오를 해야 하나요?</div>
            <div style={{ fontSize: 14, color: 'var(--sec)', lineHeight: 1.7 }}>{sc.why}</div>
          </section>
        )}

        <section className="card" style={{ marginBottom: 24, padding: '16px 20px' }} aria-label="진행 방식">
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>📋 진행 방식</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {['🔎 매 단계마다 단서 탐색', '✍️ 선택 전 짧은 자기 서술', '🤖 단계별 AI 멘토 (최대 3회)', '⏱ 시간 제한 있음', '📊 트레이드오프·숨은 비용', '✅ 프로젝트 체크리스트'].map((t, i) => (
              <span key={i} style={{ fontSize: 12, color: 'var(--sec)', padding: '6px 10px', background: 'var(--bg)', borderRadius: 5, border: '1px solid var(--border)' }}>{t}</span>
            ))}
          </div>
        </section>

        <div style={{ textAlign: 'center' }}>
          <button className="btn btn--primary" style={{ background: sc.clr, fontSize: 15, padding: '14px 48px' }} onClick={onStart}>
            시뮬레이션 시작
          </button>
        </div>
      </div>
    </main>
  );
}
