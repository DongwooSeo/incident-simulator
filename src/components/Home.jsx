import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SCENARIOS } from '../data/scenarios';
import { useCompleted } from './CompletedContext';

const CATS = [...new Set(SCENARIOS.map(s => s.cat))];
const CAT_COUNTS = Object.fromEntries(CATS.map(cat => [cat, SCENARIOS.filter(s => s.cat === cat).length]));

const INTERVIEW_QUESTIONS = [
  '서킷브레이커가 뭔가요? 실전에서 어떻게 적용하나요?',
  '배포 후 장애가 나면 어떻게 대응하시나요?',
  '분산 트랜잭션에서 데이터 정합성을 어떻게 보장하나요?',
  '프로덕션 시크릿을 어떻게 관리하나요?',
  'Kafka Consumer Lag이 급증하면 어떻게 대응하나요?',
];

const LEARNING_PATH = [
  { id: 'sc5', phase: '기초 다지기', reason: 'JPA N+1 — 가장 흔한 성능 문제부터' },
  { id: 'sc10', phase: '기초 다지기', reason: '모니터링 기초 — 장애를 감지하는 눈 만들기' },
  { id: 'sc11', phase: '기초 다지기', reason: '보안 기초 — 시크릿 관리와 인시던트 대응' },
  { id: 'sc1', phase: '장애 대응', reason: 'MSA 장애 — 서킷브레이커와 장애 전파 차단' },
  { id: 'sc6', phase: '장애 대응', reason: '배포 사고 — 롤백과 카나리 배포 전략' },
  { id: 'sc4', phase: '인프라 심화', reason: 'Redis 장애 — 캐시 스탬피드 대응' },
  { id: 'sc7', phase: '인프라 심화', reason: '세션/Redis — 데이터 영속성 설계' },
  { id: 'sc12', phase: '인프라 심화', reason: 'Kafka 장애 — Consumer Lag과 메시지 큐 운영' },
  { id: 'sc2', phase: '데이터 정합성', reason: '이중 결제 — 멱등성의 모든 것' },
  { id: 'sc3', phase: '데이터 정합성', reason: '재고 동시성 — Race Condition 해결' },
  { id: 'sc8', phase: '아키텍처', reason: '정산 장애 — 이벤트 소싱과 데이터 정합' },
  { id: 'sc9', phase: '아키텍처', reason: '분산 트랜잭션 — SAGA 패턴 실전' },
];

const RECOMMENDED_ORDER = LEARNING_PATH.map(l => l.id);
const ROADMAP_PHASES = [...new Set(LEARNING_PATH.map(l => l.phase))];

const REVIEW_DONE_KEY = 'sim_review_done';

function getReviewDone() {
  try { return JSON.parse(localStorage.getItem(REVIEW_DONE_KEY) || '{}'); } catch { return {}; }
}

function saveReviewDone(data) {
  try { localStorage.setItem(REVIEW_DONE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getReviewQuizzes(completed) {
  const now = Date.now();
  const DAY = 86400000;
  const intervals = [1 * DAY, 3 * DAY, 7 * DAY, 14 * DAY, 30 * DAY];
  const reviewDone = getReviewDone();
  const quizzes = [];

  for (const [scId, data] of Object.entries(completed)) {
    const sc = SCENARIOS.find(s => s.id === scId);
    if (!sc?.pm?.qa) continue;
    const completedDate = new Date(data.date).getTime();
    if (isNaN(completedDate)) continue;
    const elapsed = now - completedDate;
    const isDue = intervals.some(iv => elapsed >= iv - DAY / 2 && elapsed <= iv + DAY * 2);
    if (!isDue && elapsed < DAY) continue;

    const isLowScore = data.pct < 65;

    sc.pm.qa.forEach(qa => {
      const key = `${scId}:${qa.q}`;
      const lastReviewed = reviewDone[key];
      const reviewedRecently = lastReviewed && (now - lastReviewed) < DAY;
      if (reviewedRecently) return;
      quizzes.push({
        scId, icon: sc.icon, title: sc.title, q: qa.q, a: qa.a,
        priority: isLowScore ? 2 : 1, key,
      });
    });
  }
  const highPriority = shuffleArray(quizzes.filter(q => q.priority >= 2));
  const normalPriority = shuffleArray(quizzes.filter(q => q.priority < 2));
  return [...highPriority, ...normalPriority].slice(0, 3);
}

function getNextRecommended(completed) {
  return RECOMMENDED_ORDER.find(id => !completed[id]);
}

/* ── Learning Roadmap Sub-component ── */
function LearningRoadmap({ completed, nextRec }) {
  const [showRoadmap, setShowRoadmap] = useState(false);
  const doneCount = useMemo(() => LEARNING_PATH.filter(l => completed[l.id]).length, [completed]);
  const progressPct = Math.round((doneCount / LEARNING_PATH.length) * 100);

  return (
    <section style={{ marginBottom: 20 }} aria-label="학습 로드맵">
      <button
        className="roadmap-toggle"
        onClick={() => setShowRoadmap(!showRoadmap)}
        aria-expanded={showRoadmap}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="roadmap-toggle__icon">{showRoadmap ? '📖' : '🗺️'}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>추천 학습 로드맵</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              {doneCount === 0
                ? '초급 → 상급, 순서대로 따라오면 면접 준비 끝'
                : `${doneCount}/${LEARNING_PATH.length} 완료 · ${progressPct}%`}
            </div>
          </div>
          <span style={{ color: 'var(--muted)', fontSize: 18, transition: 'transform .2s', transform: showRoadmap ? 'rotate(180deg)' : 'rotate(0)' }}>⌄</span>
        </div>
        {doneCount > 0 && (
          <div className="roadmap-toggle__progress">
            <div className="roadmap-toggle__progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        )}
      </button>

      {showRoadmap && (
        <div className="roadmap">
          {ROADMAP_PHASES.map((phase, pi) => {
            const items = LEARNING_PATH.filter(l => l.phase === phase);
            const phaseDone = items.every(l => completed[l.id]);
            return (
              <div key={phase} className="roadmap__section">
                <div className="roadmap__phase-label">
                  <div className={`roadmap__phase-dot ${phaseDone ? 'roadmap__phase-dot--done' : ''}`} />
                  <span>{phase}</span>
                  {phaseDone && <span style={{ color: 'var(--green)', fontSize: 11, fontFamily: 'var(--mono)' }}>완료</span>}
                </div>

                {items.map((item, ii) => {
                  const s = SCENARIOS.find(sc => sc.id === item.id);
                  if (!s) return null;
                  const done = completed[item.id];
                  const globalIdx = LEARNING_PATH.indexOf(item);
                  const isNext = !done && item.id === nextRec;
                  const isLast = pi === ROADMAP_PHASES.length - 1 && ii === items.length - 1;
                  return (
                    <Link key={item.id} to={`/scenario/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div className={`roadmap__step ${done ? 'roadmap__step--done' : ''} ${isNext ? 'roadmap__step--next' : ''}`}>
                        <div className="roadmap__rail">
                          <div className={`roadmap__num ${done ? 'roadmap__num--done' : ''} ${isNext ? 'roadmap__num--next' : ''}`}>
                            {done ? '✓' : globalIdx + 1}
                          </div>
                          {!isLast && <div className={`roadmap__wire ${done ? 'roadmap__wire--done' : ''}`} />}
                        </div>
                        <div className="roadmap__body">
                          <div className="roadmap__title-row">
                            <span className="roadmap__icon">{s.icon}</span>
                            <span className={`roadmap__name ${done ? 'roadmap__name--done' : ''}`}>{s.title}</span>
                            {done && <span className="roadmap__pct">{done.pct}%</span>}
                            {isNext && <span className="roadmap__badge-next">NEXT</span>}
                          </div>
                          <div className="roadmap__reason">{item.reason}</div>
                          <div className="roadmap__meta">
                            <span>{s.diff}</span>
                            <span>·</span>
                            <span>{s.dur}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function Home() {
  const { completed } = useCompleted();
  const navigate = useNavigate();
  const totalDone = Object.keys(completed).length;
  const reviewQuizzes = useMemo(() => getReviewQuizzes(completed), [completed]);
  const [revealed, setRevealed] = useState({});
  const [catFilter, setCatFilter] = useState(null);
  const isFirstVisit = totalDone === 0;
  const nextRec = useMemo(() => getNextRecommended(completed), [completed]);
  const nextRecSc = useMemo(() => SCENARIOS.find(s => s.id === nextRec), [nextRec]);

  const avgPct = useMemo(() => {
    if (totalDone === 0) return 0;
    return Math.round(Object.values(completed).reduce((a, d) => a + d.pct, 0) / totalDone);
  }, [completed, totalDone]);

  const filtered = useMemo(
    () => catFilter ? SCENARIOS.filter(s => s.cat === catFilter) : SCENARIOS,
    [catFilter],
  );

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
              <button
                className="btn btn--primary"
                style={{ width: '100%', marginTop: 16, fontSize: 15, padding: '14px 28px' }}
                onClick={() => navigate(`/scenario/${nextRecSc.id}`)}
              >
                {nextRecSc.icon} 추천 시나리오로 시작하기 — {nextRecSc.title}
              </button>
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
                {avgPct}%
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div className="tag" style={{ color: 'var(--yellow)' }}>🔄 오늘의 복습</div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
                {Object.keys(revealed).length}/{reviewQuizzes.length} 완료
              </span>
            </div>
            {reviewQuizzes.map((quiz, i) => (
              <div key={i} className="card card--sm" style={{ marginBottom: 8, opacity: revealed[i] ? 0.85 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span>{quiz.icon}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{quiz.title}</span>
                  {quiz.priority >= 2 && <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--red)', background: 'rgba(239,68,68,0.1)', padding: '1px 6px', borderRadius: 3 }}>약점</span>}
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
                    onClick={() => {
                      setRevealed(prev => ({ ...prev, [i]: true }));
                      if (quiz.key) {
                        const done = getReviewDone();
                        done[quiz.key] = Date.now();
                        saveReviewDone(done);
                      }
                    }}
                  >
                    머릿속으로 답한 후 클릭하세요 →
                  </button>
                )}
              </div>
            ))}
          </section>
        )}

        <LearningRoadmap completed={completed} nextRec={nextRec} />

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
            {CATS.map(cat => (
              <button
                key={cat}
                role="tab"
                aria-selected={catFilter === cat}
                className={`cat-filter__btn ${catFilter === cat ? 'cat-filter__btn--active' : ''}`}
                onClick={() => setCatFilter(catFilter === cat ? null : cat)}
              >
                {cat} ({CAT_COUNTS[cat]})
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {filtered.map((s) => {
              const done = completed[s.id];
              const isRec = !isFirstVisit && s.id === nextRec;
              return (
                <Link key={s.id} to={`/scenario/${s.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
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
