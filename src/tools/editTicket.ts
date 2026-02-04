import { IssueType } from '../domain/ticket';
import { ISSUE_PRICING } from '../domain/pricing';
import { updateTicket } from '../store/ticketStore';

interface EditTicketInput {
  id: string;
  name?: string;
  phone?: string;
  address?: string;
  issue?: IssueType;
}

export async function editTicket(input: EditTicketInput) {
  const updates: any = { ...input };
  delete updates.id;

  if (input.issue) {
    updates.price = ISSUE_PRICING[input.issue];
  }

  return updateTicket(input.id, updates);
}