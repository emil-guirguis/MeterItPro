-- Add 'yearly' to time_frame_type and 'list' to visualization_type CHECK constraints

ALTER TABLE public.dashboard
  DROP CONSTRAINT IF EXISTS check_time_frame_type;

ALTER TABLE public.dashboard
  ADD CONSTRAINT check_time_frame_type CHECK (
    time_frame_type = ANY (ARRAY[
      'today', 'last_month', 'this_month_to_date',
      'since_installation', 'custom', 'yearly'
    ]::varchar[])
  );

ALTER TABLE public.dashboard
  DROP CONSTRAINT IF EXISTS check_visualization_type;

ALTER TABLE public.dashboard
  ADD CONSTRAINT check_visualization_type CHECK (
    visualization_type = ANY (ARRAY[
      'pie', 'line', 'candlestick', 'bar', 'area', 'list'
    ]::varchar[])
  );
