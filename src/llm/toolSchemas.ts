import { z } from 'zod';

export const issueEnum = z.enum([
  'wifi_not_working',
  'email_login_issue',
  'slow_laptop_performance',
  'printer_problem',
]);

export const createTicketSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Phone is required'),
  address: z.string().min(1, 'Address is required'),
  issue: issueEnum,
});

export const editTicketSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  issue: issueEnum.optional(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type EditTicketInput = z.infer<typeof editTicketSchema>;
