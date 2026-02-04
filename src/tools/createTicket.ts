import { randomUUID } from 'crypto';
import { Ticket, IssueType } from '../domain/ticket';
import { ISSUE_PRICING } from '../domain/pricing';
import { saveTicket } from '../store/ticketStore';

interface CreateTicketInput {
  name: string;
  email: string;
  phone: string;
  address: string;
  issue: IssueType;
}

export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  const price = ISSUE_PRICING[input.issue];

  const ticket: Ticket = {
    id: randomUUID(),
    name: input.name,
    email: input.email,
    phone: input.phone,
    address: input.address,
    issue: input.issue,
    price,
    created_at: new Date(),
  };

  await saveTicket(ticket);
  return ticket;
}