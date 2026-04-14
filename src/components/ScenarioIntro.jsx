import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GLOSSARY } from '../data/scenarios';

export default function ScenarioIntro({ sc, onStart }) {
  const [expandedTag, setExpandedTag] = useState(null);

  return (
    <main className="page">
      <div className="container" style={{ maxWidth: 600 }}>
        <Link to="/" className="back-nav">← 홈으로</Link>

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
          <section style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 'var(--space-md)' }} aria-label="학습 이유">
            <div className="tag" style={{ color: 'var(--red)', marginBottom: 6 }}>🔥 왜 이 시나리오를 해야 하나요?</div>
            <div style={{ fontSize: 14, color: 'var(--sec)', lineHeight: 1.7 }}>{sc.why}</div>
          </section>
        )}

        {sc.tags?.length > 0 && (
          <section className="card" style={{ marginBottom: 16, padding: '16px 20px' }} aria-label="핵심 키워드">
            <div className="tag" style={{ color: 'var(--yellow)', marginBottom: 10 }}>📖 이 시나리오의 핵심 키워드</div>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>모르는 용어가 있다면 탭해서 확인하세요. 시뮬레이션 중에 등장합니다.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {sc.tags.map(tag => {
                const def = GLOSSARY[tag];
                const isOpen = expandedTag === tag;
                return (
                  <div key={tag}>
                    <button
                      className="keyword-btn"
                      aria-expanded={isOpen}
                      onClick={() => setExpandedTag(isOpen ? null : tag)}
                      style={{ width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: isOpen ? 'rgba(234,179,8,0.08)' : 'var(--bg)', border: `1px solid ${isOpen ? 'rgba(234,179,8,0.3)' : 'var(--border)'}`, borderRadius: 6, cursor: 'pointer', color: 'var(--text)', fontWeight: 600, fontSize: 13, fontFamily: 'var(--sans)', transition: 'all .15s' }}
                    >
                      <span>{tag}</span>
                      <span style={{ color: 'var(--muted)', fontSize: 11, fontFamily: 'var(--mono)', flexShrink: 0 }}>{isOpen ? '▾' : '▸'}</span>
                    </button>
                    {isOpen && def && (
                      <div style={{ padding: '8px 12px', fontSize: 13, color: 'var(--sec)', lineHeight: 1.7, background: 'rgba(234,179,8,0.04)', borderRadius: '0 0 6px 6px', borderTop: 'none', animation: 'fadeIn .2s ease' }}>
                        {def}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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
