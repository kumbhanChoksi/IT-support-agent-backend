import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import type { Ticket } from '../domain/ticket';

const TICKETS_PATH = path.join(process.cwd(), 'tickets.json');

export interface TicketRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  issue: string;
  price: number;
  created_at: string;
}

function ticketToRecord(t: Ticket): TicketRecord {
  return {
    ...t,
    created_at: t.created_at instanceof Date ? t.created_at.toISOString() : (t.created_at as string),
  };
}

const DRAFT_META = { __exists: true } as const;

function ensureDraftShape(callId: string, data: Record<string, unknown>): Record<string, unknown> {
  return { ...data, id: callId, ...DRAFT_META };
}

const drafts = new Map<string, Record<string, unknown>>();

async function loadTickets(): Promise<TicketRecord[]> {
  if (!existsSync(TICKETS_PATH)) {
    return [];
  }
  const raw = await readFile(TICKETS_PATH, 'utf-8').catch(() => '[]');
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function saveTickets(tickets: TicketRecord[]): Promise<void> {
  await writeFile(TICKETS_PATH, JSON.stringify(tickets, null, 2), 'utf-8');
}

export async function createTicket(ticket: TicketRecord): Promise<void> {
  const tickets = await loadTickets();
  tickets.push(ticket);
  await saveTickets(tickets);
}

export async function saveTicket(ticket: Ticket): Promise<void> {
  await createTicket(ticketToRecord(ticket));
}

export async function updateTicket(
  id: string,
  updates: Partial<Omit<TicketRecord, 'id' | 'created_at'>>
): Promise<TicketRecord> {
  const tickets = await loadTickets();
  const idx = tickets.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error('Ticket not found');
  const updated = { ...tickets[idx], ...updates };
  tickets[idx] = updated;
  await saveTickets(tickets);
  return updated;
}

export function updateDraft(callId: string, data: Record<string, unknown>): void {
  const isNew = !drafts.has(callId);
  if (isNew) {
    console.log('[MEMORY] new callId added', { callId });
  }
  const current = drafts.get(callId) ?? ensureDraftShape(callId, {});
  console.log('[MEMORY] before update', { callId, draft: { ...current } });
  const next = ensureDraftShape(callId, { ...current, ...data });
  drafts.set(callId, next);
  console.log('[MEMORY] after update', { callId, draft: { ...next } });
}

export function getDraft(callId: string): Record<string, unknown> {
  return drafts.get(callId) ?? {};
}


export function deleteDraft(callId: string): void {
  const current = drafts.get(callId) ?? {};
  drafts.delete(callId);
  console.log('[MEMORY] draft cleared', { callId, previousDraft: { ...current } });
}
