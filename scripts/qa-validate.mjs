/**
 * QA: scenario graph + every scenario tag must exist in GLOSSARY
 */
import { SCENARIOS, GLOSSARY, isGlossaryTagDefined } from '../src/data/scenarios.js';

const errors = [];

function checkScenario(sc) {
  const { id, nodes } = sc;
  if (!nodes.start) errors.push(`${id}: missing nodes.start`);
  if (!nodes.end || nodes.end.type !== 'end') errors.push(`${id}: missing nodes.end or wrong type`);

  const ids = new Set(Object.keys(nodes));

  for (const [nodeId, n] of Object.entries(nodes)) {
    if (n.type === 'end') continue;
    const choices = n.ch;
    if (!choices?.length) continue;
    for (const c of choices) {
      if (!c.id) errors.push(`${id}: ${nodeId} choice missing id`);
      if (!c.nx) errors.push(`${id}: ${nodeId} choice ${c.id} missing nx`);
      if (!ids.has(c.nx)) errors.push(`${id}: ${nodeId} -> nx "${c.nx}" does not exist`);
      if (n.fb && n.fb[c.id] === undefined) errors.push(`${id}: ${nodeId} missing fb.${c.id}`);
    }
  }

  for (const tag of sc.tags || []) {
    if (!isGlossaryTagDefined(tag)) errors.push(`${id}: tag "${tag}" not in GLOSSARY`);
  }

  const seen = new Set();
  const q = ['start'];
  while (q.length) {
    const cur = q.shift();
    if (seen.has(cur)) continue;
    seen.add(cur);
    const n = nodes[cur];
    if (!n) {
      errors.push(`${id}: reachability hit missing node ${cur}`);
      break;
    }
    if (n.type === 'end') continue;
    for (const c of n.ch || []) {
      if (c.nx) q.push(c.nx);
    }
  }
  if (!seen.has('end')) errors.push(`${id}: nodes.end not reachable from start`);
}

for (const sc of SCENARIOS) checkScenario(sc);

const learningPath = [
  'sc5', 'sc10', 'sc11', 'sc1', 'sc6', 'sc4', 'sc7', 'sc12', 'sc2', 'sc3', 'sc8', 'sc9',
];
const scenarioIds = new Set(SCENARIOS.map(s => s.id));
for (const lid of learningPath) {
  if (!scenarioIds.has(lid)) errors.push(`LEARNING_PATH: unknown id ${lid}`);
}

console.log('Scenarios:', SCENARIOS.length);
console.log('GLOSSARY entries:', Object.keys(GLOSSARY).length);

if (errors.length) {
  console.error('QA FAIL:\n' + errors.join('\n'));
  process.exit(1);
}
console.log('QA OK: graphs, glossary tags per scenario, learning path');
