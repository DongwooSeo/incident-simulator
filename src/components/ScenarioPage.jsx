import { useParams, useNavigate } from 'react-router-dom';
import { useReducer, useEffect, useCallback, useState } from 'react';
import { SCENARIOS } from '../data/scenarios';
import { GC } from '../utils/constants';
import ScenarioIntro from './ScenarioIntro';
import ScenarioPlay from './ScenarioPlay';
import PostMortem from './PostMortem';

const init = {
  nodeId: 'intro', sel: null, revealed: false, showHint: false,
  hist: [], score: 0, cluesRevealed: {}, showChoices: false,
  freeText: '', freeSubmitted: false,
  chatMessages: [], chatInput: '', chatLoading: false,
  timer: 0, timerActive: false, timerExpired: false,
};

const SAVE_KEY = id => `sim_progress_${id}`;

function getSavedState(id) {
  try {
    const raw = sessionStorage.getItem(SAVE_KEY(id));
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (saved.nodeId === 'intro' || saved.nodeId === 'start') return null;
    return saved;
  } catch { return null; }
}

function persistState(id, state) {
  try {
    if (state.nodeId === 'intro') return;
    const serializable = { ...state, chatLoading: false };
    sessionStorage.setItem(SAVE_KEY(id), JSON.stringify(serializable));
  } catch { /* quota exceeded — ignore */ }
}

function clearSavedState(id) {
  try { sessionStorage.removeItem(SAVE_KEY(id)); } catch { /* ignore */ }
}

function reducer(state, a) {
  switch (a.type) {
    case 'RESTORE': return { ...a.state };
    case 'GO_NODE': return { ...init, nodeId: a.nodeId, score: state.score, hist: state.hist };
    case 'START': return { ...init, nodeId: 'start' };
    case 'SELECT': return { ...state, sel: a.id };
    case 'TOGGLE_HINT': return { ...state, showHint: !state.showHint };
    case 'REVEAL_CLUE': return { ...state, cluesRevealed: { ...state.cluesRevealed, [a.id]: true } };
    case 'SHOW_CHOICES': return { ...state, showChoices: true, freeSubmitted: true };
    case 'SET_FREE': return { ...state, freeText: a.text };
    case 'SET_CHAT_INPUT': return { ...state, chatInput: a.text };
    case 'CHAT_LOADING': return { ...state, chatLoading: a.v };
    case 'ADD_MSG': return { ...state, chatMessages: [...state.chatMessages, a.msg], ...(a.clearFree ? { freeText: '' } : {}), ...(a.clearInput ? { chatInput: '' } : {}) };
    case 'INIT_TIMER': return { ...state, timer: a.time, timerActive: true, timerExpired: false };
    case 'TICK': return state.timer <= 1 ? { ...state, timer: 0, timerActive: false, timerExpired: true } : { ...state, timer: state.timer - 1 };
    case 'CONFIRM': {
      const ch = a.choices.find(c => c.id === state.sel);
      const penalty = state.timerExpired ? -5 : 0;
      return {
        ...state, revealed: true, timerActive: false,
        score: state.score + GC[ch.g].score + penalty,
        hist: [...state.hist, { q: a.q, t: ch.text, g: ch.g, timedOut: state.timerExpired }],
      };
    }
    default: return state;
  }
}

export default function ScenarioPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const sc = SCENARIOS.find(s => s.id === id);
  const [state, dispatch] = useReducer(reducer, init);
  const [showResume, setShowResume] = useState(() => !!getSavedState(id));

  useEffect(() => { window.scrollTo({ top: 0 }); }, [id]);
  useEffect(() => { if (!sc) navigate('/', { replace: true }); }, [sc, navigate]);

  useEffect(() => {
    if (state.nodeId !== 'intro') {
      persistState(id, state);
    }
  }, [id, state]);

  const handleStart = useCallback(() => {
    clearSavedState(id);
    setShowResume(false);
    dispatch({ type: 'START' });
  }, [id]);

  const handleResume = useCallback(() => {
    const saved = getSavedState(id);
    if (saved) dispatch({ type: 'RESTORE', state: saved });
    setShowResume(false);
  }, [id]);

  const handleDismissResume = useCallback(() => {
    clearSavedState(id);
    setShowResume(false);
  }, [id]);

  if (!sc) return null;

  const node = sc.nodes[state.nodeId];
  const isEnd = node?.type === 'end';

  useEffect(() => {
    if (isEnd) clearSavedState(id);
  }, [isEnd, id]);

  if (state.nodeId === 'intro') {
    const saved = showResume ? getSavedState(id) : null;
    return (
      <>
        {showResume && (
          <div className="resume-banner">
            <div className="resume-banner__inner">
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>진행 중인 시뮬레이션이 있습니다</div>
                <div style={{ fontSize: 12, color: 'var(--sec)' }}>STEP {saved?.hist?.length + 1 || '?'} · 점수 {saved?.score || 0}점</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn--primary btn--sm" onClick={handleResume}>이어하기</button>
                <button className="btn btn--ghost" onClick={handleDismissResume}>처음부터</button>
              </div>
            </div>
          </div>
        )}
        <ScenarioIntro sc={sc} onStart={handleStart} />
      </>
    );
  }
  if (isEnd) {
    return <PostMortem sc={sc} state={state} onRestart={handleStart} />;
  }
  return <ScenarioPlay sc={sc} node={node} state={state} dispatch={dispatch} />;
}
