// ============================================================================
// Dashboard-specific types for activity feed & analytics
// ============================================================================

export interface ActivityItem {
  id?: string;
  _id?: string;
  summaryNumber?: string;
  billNumber?: string;
  invoiceNumber?: string;
  clientName?: string;
  client?: { name?: string; companyName?: string } | string;
  date?: string;
  amount?: number;
  baseAmount?: number;
  itemGstAmount?: number;
  taxAmount?: number;
  quantity?: number;
  unitPrice?: number;
  taxes?: { name?: string; percentage?: number; amount?: number }[];
  netPayable?: number;
  grandTotal?: number;
  totalAmount?: number;
  status?: string;
  type?: "Bill" | "Summary";
}

export interface TopClient {
  name: string;
  total: number;
}

export interface TopClientsProps {
  data: TopClient[];
  loading: boolean;
}
