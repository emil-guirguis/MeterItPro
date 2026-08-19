/** QuickBooks customer row (tbwc-site public.qb_customer). PK is `qb_customer_id`.
 *  Read-only mirror synced from QuickBooks via the QBWC pull. */
export interface Customer {
  qb_customer_id: number;
  /** Normalised alias of qb_customer_id set by the entity store (idFieldName). */
  id?: number | string;
  list_id: string;
  full_name: string | null;
  name: string | null;
  company_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  bill_addr: { addr1?: string; addr2?: string; city?: string; state?: string; postal?: string } | null;
  is_active: boolean | null;
  balance: number | null;
  time_modified: string | null;
  synced_at: string | null;
}
