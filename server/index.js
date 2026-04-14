import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

const hits = new Map();
const WINDOW = 60_000;
const MAX_REQ = 30;

function rateLimit(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress;
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now - entry.start > WINDOW) {
    hits.set(ip, { start: now, count: 1 });
    return next();
  }
  if (++entry.count > MAX_REQ) {
    return res.status(429).json({ error: { message: '요청이 너무 많습니다. 1분 후 다시 시도해주세요.' } });
  }
  next();
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of hits) {
    if (now - entry.start > WINDOW) hits.delete(ip);
  }
}, 300_000);

app.post('/api/chat', rateLimit, async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: { message: 'ANTHROPIC_API_KEY가 설정되지 않았습니다. .env 파일을 확인해주세요.' },
    });
  }

  const messages = req.body?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: { message: 'messages 배열이 필요합니다.' } });
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
});

const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  const distPath = join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (_, res) => res.sendFile(join(distPath, 'index.html')));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
