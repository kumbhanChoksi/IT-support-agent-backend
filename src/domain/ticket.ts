export type IssueType =
  | 'wifi_not_working'
  | 'email_login_issue'
  | 'slow_laptop_performance'
  | 'printer_problem';

export interface Ticket {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  issue: IssueType;
  price: number;
  created_at: Date;
}