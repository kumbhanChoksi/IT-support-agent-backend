import { Request, Response } from 'express';
import { createTicket, updateDraft, getDraft, deleteDraft } from '../store/ticketStore';
import type { TicketRecord } from '../store/ticketStore';

const PRICE_MAP: Record<string, number> = {
  wifi_not_working: 20,
  email_login_issue: 15,
  slow_laptop_performance: 25,
  printer_problem: 10,
};

export async function handleVapiWebhook(req: Request, res: Response) {
  try {
    const payload = req.body.message ?? req.body;
    const { type, toolCalls, call } = payload;
    const callId = call?.id;

    if (type === 'assistant.ended' || type === 'call.ended') {
      if (callId) deleteDraft(callId);
      return res.status(200).json({ ok: true });
    }

    if (type === 'tool-calls') {
      if (!callId) return res.status(200).json({ ok: true });

      const results: { toolCallId: string; result: unknown }[] = [];

      for (const toolCall of toolCalls ?? []) {
        const { name, arguments: args } = toolCall.function ?? {};

        switch (name) {
          case 'edit_ticket':
            updateDraft(callId, { ...getDraft(callId), ...(args ?? {}) });
            results.push({
              toolCallId: toolCall.id,
              result: {
                success: true,
                updatedFields: Object.keys(args ?? {}),
              },
            });
            break;

          case 'create_ticket': {
            const draft = { ...getDraft(callId), ...(args ?? {}) };
            const finalData: TicketRecord = {
              id: `TIX-${Date.now()}`,
              name: draft.name as string,
              email: draft.email as string,
              phone: (draft.phone as string) ?? '',
              address: (draft.address as string) ?? '',
              issue: draft.issue as string,
              price: PRICE_MAP[draft.issue as string] ?? 0,
              created_at: new Date().toISOString(),
            };

            if (!finalData.name || !finalData.email || !finalData.issue) {
              results.push({
                toolCallId: toolCall.id,
                result: { error: 'Missing required fields' },
              });
              break;
            }

            if (draft.__created) break;

            await createTicket(finalData);

            updateDraft(callId, { ...getDraft(callId), __created: true });

            results.push({
              toolCallId: toolCall.id,
              result: { ticketId: finalData.id, status: 'Confirmed' },
            });
            break;
          }
        }
      }

      if (results.length > 0) {
        return res.status(200).json({ results });
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('VAPI webhook error:', err);
    return res.status(500).json({
      error: 'Webhook failed',
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
