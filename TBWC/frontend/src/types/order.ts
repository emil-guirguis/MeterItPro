/** Order row shape (tbwc-site public."order"). PK is `id` (bigint). */
export interface Order {
  id: number;
  customer: string | null;
  build_notes: string | null;
  exp: string | null;
  inv_stat: string | null;
  tbwc_number: string | null;
  po_number: string | null;
  received_date: string | null;
  ship_nlt: string | null;
  shipment_date: string | null;
  rep: string | null;
  rep_id: string | null;
  job_name: string | null;
  jay: string | null;
  notes: string | null;
  dnc: number | null;
  sold_for: number | null;
  comm_15: number | null;
  ovg_75_25: number | null;
  proj_adm: number | null;
  comm_total: number | null;
  trade_ally: string | null;
  su: string | null;
}
