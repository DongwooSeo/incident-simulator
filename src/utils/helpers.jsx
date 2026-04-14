export function bold(str) {
  if (!str || typeof str !== 'string') return str;
  const parts = str.split('**');
  if (parts.length < 3) return str;
  return parts.map((s, i) =>
    i % 2 === 1 ? <strong key={i}>{s}</strong> : s,
  );
}
