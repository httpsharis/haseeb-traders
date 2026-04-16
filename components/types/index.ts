// types/index.ts

export interface ActivityItem {
  _id?: string;
  id?: string;
  amount?: number;
  date?: string;
  status?: string;
  clientName?: string;
  summaryNumber?: string;
  billNumber?: string;
  invoiceNumber?: string;
  type?: "Bill" | "Summary"; // Added this back for your main page logic!
  client?: string | { _id?: string; name?: string; companyName?: string };
}

export interface TopClient {
  name: string;
  total: number;
}

export interface TopClientsProps {
  data: TopClient[];
  loading: boolean;
}