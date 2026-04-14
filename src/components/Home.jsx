import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { SCENARIOS } from '../data/scenarios';
import { useCompleted } from './CompletedContext';

const CATS = [...new Set(SCENARIOS.map(s => s.cat))];

const INTERVIEW_QUESTIONS = [
  '서킷브레이커가 뭔가요? 실전에서 어떻게 적용하나요?',
  '배포 후 장애가 나면 어떻게 대응하시나요?',
  '분산 트랜잭션에서 데이터 정합성을 어떻게 보장하나요?',
];

const RECOMMENDED_ORDER = ['sc1', 'sc10', 'sc6', 'sc2', 'sc3'];

function getReviewQuizzes(completed) {
  const now = Date.now();
  const DAY = 86400000;
  const intervals = [3 * DAY, 7 * DAY, 14 * DAY, 30 * DAY];
  const quizzes = [];

  for (const [scId, data] of Object.entries(completed)) {
    const sc = SCENARIOS.find(s => s.id === scId);
    if (!sc?.pm?.qa) continue;
    const completedDate = new Date(data.date).getTime();
    if (isNaN(completedDate)) continue;
    const elapsed = now - completedDate;
    const isDue = intervals.some(iv => elapsed >= iv - DAY / 2 && elapsed <= iv + DAY * 2);
    const isOld = elapsed > 2 * DAY;
    if (isDue || isOld) {
      sc.pm.qa.forEach(qa => quizzes.push({ scId, icon: sc.icon, title: sc.title, q: qa.q, a: qa.a }));
    }
  }
  const shuffled = quizzes.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 2);
}

function getNextRecommended(completed) {
  return RECOMMENDED_ORDER.find(id => !completed[id]);
}

export default function Home() {
  const { completed } = useCompleted();
  const totalDone = Object.keys(completed).length;
  const reviewQuizzes = useMemo(() => getReviewQuizzes(completed), [completed]);
  const [revealed, setRevealed] = useState({});
  const [catFilter, setCatFilter] = useState(null);
  const isFirstVisit = totalDone === 0;
  const nextRec = getNextRecommended(completed);
  const nextRecSc = SCENARIOS.find(s => s.id === nextRec);

  const filtered = catFilter
    ? SCENARIOS.filter(s => s.cat === catFilter)
    : SCENARIOS;

  return (
    <main className="page">
      <div className="container container--wide">
        <header style={{ textAlign: 'center', marginBottom: 32 }}>
          <span className="tag" style={{ color: 'var(--blue)', background: 'var(--blue-dark)', marginBottom: 16 }}>
            ECOMMERCE INCIDENT SIMULATOR v2
          </span>
          <h1 style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.3, marginTop: 16, marginBottom: 12 }}>
            현업 장애 시뮬레이션
          </h1>
          <p style={{ fontSize: 14, color: 'var(--sec)', lineHeight: 1.7, maxWidth: 520, margin: '0 auto' }}>
            부트캠프에서 안 가르치는 장애 대응을 실전처럼 경험하세요.<br />
            로그를 읽고, 판단하고, AI 멘토와 토론한 뒤 면접까지 대비합니다.
          </p>
        </header>

        {isFirstVisit && (
          <section className="hero-value" style={{ marginBottom: 24 }} aria-label="가치 제안">
            <div className="hero-value__questions">
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--red)', marginBottom: 10, letterSpacing: 0.5 }}>면접에서 이런 질문 받으면 답할 수 있나요?</div>
              {INTERVIEW_QUESTIONS.map((q, i) => (
                <div key={i} className="hero-value__q">
                  <span style={{ color: 'var(--muted)', flexShrink: 0 }}>Q{i + 1}.</span>
                  <span>{q}</span>
                </div>
              ))}
            </div>
            <div className="hero-value__benefits">
              {[
                { icon: '🔎', text: '실제 로그·메트릭·트레이스를 분석' },
                { icon: '🤖', text: 'AI 멘토가 사고 과정을 코칭' },
                { icon: '🎤', text: '시나리오 끝나면 바로 면접 연습' },
                { icon: '⏱', text: '시간 압박 속 의사결정 훈련' },
              ].map((b, i) => (
                <div key={i} className="hero-value__benefit">
                  <span>{b.icon}</span><span>{b.text}</span>
                </div>
              ))}
            </div>
            {nextRecSc && (
              <Link to={`/scenario/${nextRecSc.id}`} style={{ textDecoration: 'none' }}>
                <button className="btn btn--primary" style={{ width: '100%', marginTop: 16, fontSize: 15, padding: '14px 28px' }}>
                  {nextRecSc.icon} 추천 시나리오로 시작하기 — {nextRecSc.title}
                </button>
              </Link>
            )}
          </section>
        )}

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

        {totalDone > 0 && nextRecSc && (
          <Link to={`/scenario/${nextRecSc.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="rec-next" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>{nextRecSc.icon}</span>
                <div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--blue)', marginBottom: 2 }}>다음 추천</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{nextRecSc.title}</div>
                </div>
              </div>
              <span style={{ color: 'var(--blue)', fontSize: 18 }}>→</span>
            </div>
          </Link>
        )}

        {reviewQuizzes.length > 0 && (
          <section style={{ marginBottom: 20 }} aria-label="복습 퀴즈">
            <div className="tag" style={{ color: 'var(--yellow)', marginBottom: 10 }}>🔄 오늘의 복습</div>
            {reviewQuizzes.map((quiz, i) => (
              <div key={i} className="card card--sm" style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span>{quiz.icon}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{quiz.title}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--blue)', marginBottom: 8 }}>Q. {quiz.q}</div>
                {revealed[i] ? (
                  <div style={{ fontSize: 13, color: 'var(--sec)', lineHeight: 1.7, padding: '8px 12px', background: 'rgba(34,197,94,0.06)', borderRadius: 6, border: '1px solid rgba(34,197,94,0.15)' }}>
                    A. {quiz.a}
                  </div>
                ) : (
                  <button
                    className="btn btn--ghost"
                    style={{ fontSize: 12 }}
                    onClick={() => setRevealed(prev => ({ ...prev, [i]: true }))}
                  >
                    머릿속으로 답한 후 클릭하세요 →
                  </button>
                )}
              </div>
            ))}
          </section>
        )}

        <nav aria-label="시나리오 목록">
          <div className="cat-filter" role="tablist" aria-label="카테고리 필터">
            <button
              role="tab"
              aria-selected={!catFilter}
              className={`cat-filter__btn ${!catFilter ? 'cat-filter__btn--active' : ''}`}
              onClick={() => setCatFilter(null)}
            >
              전체 ({SCENARIOS.length})
            </button>
            {CATS.map(cat => {
              const count = SCENARIOS.filter(s => s.cat === cat).length;
              return (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={catFilter === cat}
                  className={`cat-filter__btn ${catFilter === cat ? 'cat-filter__btn--active' : ''}`}
                  onClick={() => setCatFilter(catFilter === cat ? null : cat)}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {filtered.map((s, i) => {
              const done = completed[s.id];
              const isRec = !isFirstVisit && s.id === nextRec;
              return (
                <Link key={s.id} to={`/scenario/${s.id}`} style={{ textDecoration: 'none', color: 'inherit', animationDelay: `${i * 0.05}s` }}>
                  <article
                    className="sc-card"
                    style={done ? { borderColor: 'rgba(34,197,94,0.2)' } : isRec ? { borderColor: 'rgba(59,130,246,0.3)' } : undefined}
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
                        {isRec && !done && <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--blue)', background: 'var(--blue-dark)', padding: '1px 6px', borderRadius: 3 }}>추천</span>}
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
