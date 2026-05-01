--
-- PostgreSQL database dump
--

\restrict HzvZibufrhit7tWnhbm8PaD7WkiAol0CZb4fKnZviR3HsGN3bcwfupv3b9LcwRp

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: device_register; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.device_register (
    device_id integer NOT NULL,
    register_id integer NOT NULL
);


--
-- Name: meter; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meter (
    meter_id bigint DEFAULT 0 CONSTRAINT meter_id_not_null NOT NULL,
    name character varying(200) NOT NULL,
    ip character varying(15),
    port integer,
    active boolean DEFAULT true,
    last_reading_at date,
    element character varying(2),
    meter_element_id bigint NOT NULL,
    device_id bigint DEFAULT 0 NOT NULL
);


--
-- Name: meter_reading; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meter_reading (
    meter_reading_id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    sync_status character varying(20),
    tenant_id bigint DEFAULT 0 NOT NULL,
    meter_id bigint DEFAULT 0 NOT NULL,
    kwh numeric(18,4) DEFAULT 0,
    mwh numeric(18,4) DEFAULT 0,
    kvah numeric(18,4) DEFAULT 0,
    kvah_export numeric(18,4) DEFAULT 0,
    kva numeric(18,4) DEFAULT 0,
    phase_kva_a numeric(18,4) DEFAULT 0,
    phase_kva_b numeric(18,4) DEFAULT 0,
    phase_kva_c numeric(18,4) DEFAULT 0,
    amperage numeric(18,4) DEFAULT 0,
    phase_amperage_a numeric(18,4) DEFAULT 0,
    phase_amperage_b numeric(18,4) DEFAULT 0,
    phase_amperage_c numeric(18,4) DEFAULT 0,
    frequency numeric(18,4) DEFAULT 0,
    peak_kw numeric(18,4) DEFAULT 0,
    kw numeric(18,4) DEFAULT 0,
    power_factor numeric(18,4) DEFAULT 0,
    pf_a numeric(18,4) DEFAULT 0,
    pf_b numeric(18,4) DEFAULT 0,
    pf_c numeric(18,4) DEFAULT 0,
    phase_kw_a numeric(18,4) DEFAULT 0,
    phase_kw_b numeric(18,4) DEFAULT 0,
    phase_kw_c numeric(18,4) DEFAULT 0,
    kvarh numeric(18,4) DEFAULT 0,
    reactive_energy_export numeric(18,4) DEFAULT 0,
    kvar numeric(18,4) DEFAULT 0,
    phase_kvar_a numeric(18,4) DEFAULT 0,
    phase_kvar_b numeric(18,4) DEFAULT 0,
    phase_kvar_c numeric(18,4) DEFAULT 0,
    voltage_a_b numeric(18,4) DEFAULT 0,
    voltage_a_n numeric(18,4) DEFAULT 0,
    voltage_b_c numeric(18,4) DEFAULT 0,
    voltage_b_n numeric(18,4) DEFAULT 0,
    voltage_c_a numeric(18,4) DEFAULT 0,
    voltage_c_n numeric(18,4) DEFAULT 0,
    voltage_p_n numeric(18,4) DEFAULT 0,
    voltage_p_p numeric(18,4) DEFAULT 0,
    total_thdv numeric(18,4) DEFAULT 0,
    phase_thdv_a numeric(18,4) DEFAULT 0,
    phase_thdv_b numeric(18,4) DEFAULT 0,
    phase_thdv_c numeric(18,4) DEFAULT 0,
    meter_element_id bigint,
    is_synchronized boolean DEFAULT false,
    retry_count bigint DEFAULT 0,
    calculated_kwh numeric(18,4) DEFAULT NULL::numeric
);


--
-- Name: register; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.register (
    register_id integer NOT NULL,
    name character varying(255) NOT NULL,
    register integer NOT NULL,
    unit character varying(50),
    field_name character varying(255),
    description character varying(255)
);


--
-- Name: register_register_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.register_register_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: register_register_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.register_register_id_seq OWNED BY public.register.register_id;


--
-- Name: sync_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sync_log (
    sync_log_id integer CONSTRAINT sync_log_id_not_null NOT NULL,
    batch_size integer,
    success boolean,
    error_message text,
    synced_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    operation_type character varying(20)
);


--
-- Name: sync_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sync_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sync_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sync_log_id_seq OWNED BY public.sync_log.sync_log_id;


--
-- Name: tenant; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant (
    tenant_id bigint CONSTRAINT tenant_id_not_null NOT NULL,
    name character varying(100) NOT NULL,
    url character varying(255),
    street character varying(100),
    street2 character varying(100),
    city character varying(50),
    state character varying(50),
    zip character varying(15),
    country character varying(50),
    active boolean DEFAULT true NOT NULL,
    meter_reading_batch_count smallint DEFAULT 100,
    api_key character varying(255) DEFAULT ''::character varying NOT NULL,
    download_batch_size integer DEFAULT 1000 NOT NULL,
    upload_batch_size integer DEFAULT 100 NOT NULL
);


--
-- Name: COLUMN tenant.url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tenant.url IS 'Company website URL';


--
-- Name: COLUMN tenant.city; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tenant.city IS 'City';


--
-- Name: COLUMN tenant.state; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tenant.state IS 'State/Province';


--
-- Name: COLUMN tenant.zip; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tenant.zip IS 'Postal code';


--
-- Name: COLUMN tenant.country; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tenant.country IS 'Country';


--
-- Name: COLUMN tenant.active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tenant.active IS 'Whether the tenant is active';


--
-- Name: register register_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register ALTER COLUMN register_id SET DEFAULT nextval('public.register_register_id_seq'::regclass);


--
-- Name: sync_log sync_log_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sync_log ALTER COLUMN sync_log_id SET DEFAULT nextval('public.sync_log_id_seq'::regclass);


--
-- Name: device_register device_register_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_register
    ADD CONSTRAINT device_register_pkey PRIMARY KEY (device_id, register_id);


--
-- Name: meter meter_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meter
    ADD CONSTRAINT meter_pkey PRIMARY KEY (meter_id, meter_element_id);


--
-- Name: meter_reading meter_readings_realtime_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meter_reading
    ADD CONSTRAINT meter_readings_realtime_pkey PRIMARY KEY (meter_reading_id);


--
-- Name: register register_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register
    ADD CONSTRAINT register_pkey PRIMARY KEY (register_id);


--
-- Name: sync_log sync_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sync_log
    ADD CONSTRAINT sync_log_pkey PRIMARY KEY (sync_log_id);


--
-- Name: tenant tenant_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant
    ADD CONSTRAINT tenant_pkey PRIMARY KEY (tenant_id);


--
-- Name: device_register_device_id_register_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX device_register_device_id_register_id_key ON public.device_register USING btree (device_id, register_id);


--
-- Name: fki_fk_meter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fki_fk_meter_id ON public.meter_reading USING btree (meter_id) WITH (fillfactor='100', deduplicate_items='true');


--
-- Name: idx_meter_reading_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_meter_reading_created_at ON public.meter_reading USING btree (created_at);


--
-- Name: idx_meter_reading_is_synchronized; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_meter_reading_is_synchronized ON public.meter_reading USING btree (is_synchronized);


--
-- Name: idx_meter_reading_meter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_meter_reading_meter_id ON public.meter_reading USING btree (meter_id);


--
-- Name: idx_meters_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_meters_is_active ON public.meter USING btree (active) WITH (fillfactor='100', deduplicate_items='true');


--
-- Name: idx_sync_log_synced_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sync_log_synced_at ON public.sync_log USING btree (synced_at);


--
-- PostgreSQL database dump complete
--

\unrestrict HzvZibufrhit7tWnhbm8PaD7WkiAol0CZb4fKnZviR3HsGN3bcwfupv3b9LcwRp

