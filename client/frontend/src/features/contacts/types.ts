/**
 * Contact Types
 * 
 * TypeScript type definitions for Contact entity.
 * Schema is loaded dynamically from backend via useSchema('contact')
 */

export type Contact = {
  id?: string;
  contact_id?: number;
  name: string;
  company?: string;
  role?: string;
  email: string;
  phone: string;
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  notes?: string;
  active?: boolean;
  created_at?: Date;
  updated_at?: Date;
};
