-- Support site: adminsupport role, device.active column, support_ticket table

-- 1. Add adminsupport role to constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check
  CHECK (role::text = ANY (ARRAY[
    'superadmin'::text,
    'supersupport'::text,
    'adminsupport'::text,
    'admin'::text,
    'manager'::text,
    'technician'::text,
    'viewer'::text,
    'user'::text
  ]));

-- 2. Add active column to device catalog (soft-delete instead of hard delete)
ALTER TABLE public.device ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

-- 3. Support ticket table
CREATE TABLE IF NOT EXISTS public.support_ticket (
    support_ticket_id serial NOT NULL,
    tenant_id integer NOT NULL,
    client_tenant_id integer,
    users_id integer,
    assigned_to_users_id integer,
    title  varchar(200),
    description text,
    type  varchar(30) NOT NULL DEFAULT 'general',
    status  varchar(20) NOT NULL DEFAULT 'open',
    priority  varchar(20) NOT NULL DEFAULT 'medium',
    resolved_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT support_ticket_pkey PRIMARY KEY (support_ticket_id),
    CONSTRAINT support_ticket_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(tenant_id),
    CONSTRAINT support_ticket_client_tenant_id_fkey FOREIGN KEY (client_tenant_id) REFERENCES public.tenant(tenant_id),
    CONSTRAINT support_ticket_users_id_fkey FOREIGN KEY (users_id) REFERENCES public.users(users_id),
    CONSTRAINT support_ticket_assigned_to_users_id_fkey FOREIGN KEY (assigned_to_users_id) REFERENCES public.users(users_id),
    CONSTRAINT support_ticket_type_check CHECK (type::text = ANY (ARRAY['bug'::text, 'feature_request'::text, 'billing'::text, 'account'::text, 'technical'::text, 'general'::text])),
    CONSTRAINT support_ticket_status_check CHECK (status::text = ANY (ARRAY['open'::text, 'in_progress'::text, 'resolved'::text, 'closed'::text])),
    CONSTRAINT support_ticket_priority_check CHECK (priority::text = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]))
);

CREATE SEQUENCE IF NOT EXISTS public.support_ticket_support_ticket_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.support_ticket_support_ticket_id_seq OWNED BY public.support_ticket.support_ticket_id;
ALTER TABLE ONLY public.support_ticket ALTER COLUMN support_ticket_id SET DEFAULT nextval('public.support_ticket_support_ticket_id_seq'::regclass);

CREATE INDEX IF NOT EXISTS idx_support_ticket_tenant_id ON public.support_ticket USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_client_tenant_id ON public.support_ticket USING btree (client_tenant_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_status ON public.support_ticket USING btree (status);
CREATE INDEX IF NOT EXISTS idx_support_ticket_created_at ON public.support_ticket USING btree (created_at);
