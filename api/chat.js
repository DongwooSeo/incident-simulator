const hits = new Map();
const WINDOW = 60_000;
const MAX_REQ = 30;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now - entry.start > WINDOW) {
    hits.set(ip, { start: now, count: 1 });
    return false;
  }
  if (++entry.count > MAX_REQ) return true;
  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: { message: 'Method Not Allowed' } });
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
  if (checkRateLimit(ip)) {
    return res.status(429).json({ error: { message: '요청이 너무 많습니다. 1분 후 다시 시도해주세요.' } });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: { message: 'ANTHROPIC_API_KEY가 설정되지 않았습니다.' },
    });
  }

  const messages = req.body?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: { message: 'messages 배열이 필요합니다.' } });
  }
  if (messages.length > 10) {
    return res.status(400).json({ error: { message: '메시지는 최대 10개까지 허용됩니다.' } });
  }

  const sanitized = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 600,
    messages: messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: typeof m.content === 'string' ? m.content.slice(0, 4000) : '',
    })),
  };

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(sanitized),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
}
