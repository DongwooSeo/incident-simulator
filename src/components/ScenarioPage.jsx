import { useParams, useNavigate } from 'react-router-dom';
import { useReducer, useEffect } from 'react';
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

function reducer(state, a) {
  switch (a.type) {
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

  useEffect(() => { window.scrollTo({ top: 0 }); }, [id]);
  useEffect(() => { if (!sc) navigate('/', { replace: true }); }, [sc, navigate]);

  if (!sc) return null;

  const node = sc.nodes[state.nodeId];

  if (state.nodeId === 'intro') {
    return <ScenarioIntro sc={sc} onStart={() => dispatch({ type: 'START' })} />;
  }
  if (node?.type === 'end') {
    return <PostMortem sc={sc} state={state} onRestart={() => dispatch({ type: 'START' })} />;
  }
  return <ScenarioPlay sc={sc} node={node} state={state} dispatch={dispatch} />;
}
