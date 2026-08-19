/** Inventory catalog row (tbwc-site public.inventory). PK is `inventory_id`. */
export interface Inventory {
  inventory_id: number;
  /** Normalised alias of inventory_id set by the entity store (idFieldName). */
  id?: number | string;
  part_number: string | null;
  description: string | null;
  category: string | null;
  base_price: number | null;
  msrp: number | null;
  moq: number | null;
  dnet_cost: number | null;
  unit_weight: number | null;
  pack_qty: number | null;
  service_days: number | null;
  distribution_type: string | null;
  upc_code: string | null;
  is_active: boolean;
}
