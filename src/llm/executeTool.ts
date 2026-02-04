import { createTicket } from '../tools/createTicket';
import { editTicket } from '../tools/editTicket';
import {
  createTicketSchema,
  editTicketSchema,
  CreateTicketInput,
  EditTicketInput,
} from './toolSchemas';

type ToolName = 'create_ticket' | 'edit_ticket';

export async function executeTool(
  toolName: ToolName,
  rawArgs: unknown
) {
  switch (toolName) {
    case 'create_ticket': {
      const parsed = createTicketSchema.parse(rawArgs);
      const ticket = await createTicket(parsed as CreateTicketInput);
      return ticket;
    }

    case 'edit_ticket': {
      const parsed = editTicketSchema.parse(rawArgs);

      const ticket = await editTicket(parsed as EditTicketInput);

      return ticket;
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}