import express, { Request, Response } from 'express';
import cors from 'cors';
import { vapiAgent, initializeAssistant } from './vapi/agent';
import { handleVapiWebhook } from './vapi/vapiWebhook';

const app = express();

const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3001';

app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  })
);

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.post('/vapi/webhook', handleVapiWebhook);

app.post('/api/session/start', async (_req: Request, res: Response) => {
  try {
    await initializeAssistant();
    const session = await vapiAgent.createSession();
    res.status(201).json({
      assistantId: session.assistantId,
      sessionId: session.id,
    });
  } catch (err) {
    console.error('Failed to create VAPI session:', err);
    res.status(500).json({
      error: 'Failed to start session',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

export default app;
