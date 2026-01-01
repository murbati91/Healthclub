-- Fix script: Safe to re-run
-- Drops existing objects and recreates them

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS public.idx_profiles_role;
DROP INDEX IF EXISTS public.idx_profiles_phone;
DROP INDEX IF EXISTS public.idx_profiles_area;
DROP INDEX IF EXISTS public.idx_packages_active;
DROP INDEX IF EXISTS public.idx_package_options_package_id;
DROP INDEX IF EXISTS public.idx_package_options_active;
DROP INDEX IF EXISTS public.idx_dietary_options_category;
DROP INDEX IF EXISTS public.idx_dietary_options_active;
DROP INDEX IF EXISTS public.idx_subscriptions_user_id;
DROP INDEX IF EXISTS public.idx_subscriptions_status;
DROP INDEX IF EXISTS public.idx_subscriptions_dates;
DROP INDEX IF EXISTS public.idx_subscriptions_active;
DROP INDEX IF EXISTS public.idx_drivers_user_id;
DROP INDEX IF EXISTS public.idx_drivers_area;
DROP INDEX IF EXISTS public.idx_drivers_active;
DROP INDEX IF EXISTS public.idx_daily_orders_subscription_id;
DROP INDEX IF EXISTS public.idx_daily_orders_driver_id;
DROP INDEX IF EXISTS public.idx_daily_orders_delivery_date;
DROP INDEX IF EXISTS public.idx_daily_orders_status;
DROP INDEX IF EXISTS public.idx_daily_orders_driver_date;
DROP INDEX IF EXISTS public.idx_whatsapp_messages_driver_id;
DROP INDEX IF EXISTS public.idx_whatsapp_messages_order_id;
DROP INDEX IF EXISTS public.idx_whatsapp_messages_status;
DROP INDEX IF EXISTS public.idx_whatsapp_messages_pending;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
DROP TRIGGER IF EXISTS update_drivers_updated_at ON public.drivers;
DROP TRIGGER IF EXISTS update_daily_orders_updated_at ON public.daily_orders;

-- Drop existing views if they exist
DROP VIEW IF EXISTS public.active_subscriptions_view;
DROP VIEW IF EXISTS public.daily_orders_view;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.generate_daily_orders(DATE);
DROP FUNCTION IF EXISTS public.auto_assign_driver_to_order(UUID);

-- Now recreate all indexes
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_phone ON public.profiles(phone);
CREATE INDEX idx_profiles_area ON public.profiles(area) WHERE role = 'customer';
CREATE INDEX idx_packages_active ON public.packages(active);
CREATE INDEX idx_package_options_package_id ON public.package_options(package_id);
CREATE INDEX idx_package_options_active ON public.package_options(active);
CREATE INDEX idx_dietary_options_category ON public.dietary_options(category);
CREATE INDEX idx_dietary_options_active ON public.dietary_options(active);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_dates ON public.subscriptions(start_date, end_date);
CREATE INDEX idx_subscriptions_active ON public.subscriptions(user_id, status) WHERE status = 'active';
CREATE INDEX idx_drivers_user_id ON public.drivers(user_id);
CREATE INDEX idx_drivers_area ON public.drivers(assigned_area);
CREATE INDEX idx_drivers_active ON public.drivers(active) WHERE active = true;
CREATE INDEX idx_daily_orders_subscription_id ON public.daily_orders(subscription_id);
CREATE INDEX idx_daily_orders_driver_id ON public.daily_orders(driver_id);
CREATE INDEX idx_daily_orders_delivery_date ON public.daily_orders(delivery_date);
CREATE INDEX idx_daily_orders_status ON public.daily_orders(status);
CREATE INDEX idx_daily_orders_driver_date ON public.daily_orders(driver_id, delivery_date) WHERE status IN ('preparing', 'out_for_delivery');
CREATE INDEX idx_whatsapp_messages_driver_id ON public.whatsapp_messages(driver_id);
CREATE INDEX idx_whatsapp_messages_order_id ON public.whatsapp_messages(order_id);
CREATE INDEX idx_whatsapp_messages_status ON public.whatsapp_messages(status);
CREATE INDEX idx_whatsapp_messages_pending ON public.whatsapp_messages(status, created_at) WHERE status = 'pending';

-- Recreate updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_orders_updated_at BEFORE UPDATE ON public.daily_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Recreate functions
CREATE OR REPLACE FUNCTION public.generate_daily_orders(target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(orders_created INTEGER, subscription_id UUID, order_id UUID) AS $$
DECLARE
  sub_record RECORD;
  day_of_week TEXT;
  new_order_id UUID;
  order_count INTEGER := 0;
BEGIN
  day_of_week := LOWER(TO_CHAR(target_date, 'Day'));
  day_of_week := TRIM(day_of_week);

  FOR sub_record IN
    SELECT
      s.id,
      s.user_id,
      s.selected_days,
      s.package_id,
      s.package_option_id,
      po.meals_per_day,
      p.full_name,
      p.address,
      p.area,
      p.building,
      p.flat_number
    FROM public.subscriptions s
    JOIN public.profiles p ON s.user_id = p.id
    JOIN public.package_options po ON s.package_option_id = po.id
    WHERE s.status = 'active'
      AND target_date BETWEEN s.start_date AND s.end_date
      AND s.selected_days ? day_of_week
      AND NOT EXISTS (
        SELECT 1 FROM public.daily_orders dor
        WHERE dor.subscription_id = s.id
        AND dor.delivery_date = target_date
      )
  LOOP
    DECLARE
      delivery_addr TEXT;
    BEGIN
      delivery_addr := CONCAT_WS(', ',
        sub_record.address,
        CASE WHEN sub_record.building IS NOT NULL THEN 'Building: ' || sub_record.building END,
        CASE WHEN sub_record.flat_number IS NOT NULL THEN 'Flat: ' || sub_record.flat_number END,
        sub_record.area
      );

      INSERT INTO public.daily_orders (
        subscription_id,
        delivery_date,
        delivery_address,
        meal_details,
        status
      ) VALUES (
        sub_record.id,
        target_date,
        delivery_addr,
        jsonb_build_object(
          'meals_per_day', sub_record.meals_per_day,
          'customer_name', sub_record.full_name
        ),
        'scheduled'
      ) RETURNING id INTO new_order_id;

      order_count := order_count + 1;

      RETURN QUERY SELECT order_count, sub_record.id, new_order_id;
    END;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.auto_assign_driver_to_order(order_uuid UUID)
RETURNS UUID AS $$
DECLARE
  order_area TEXT;
  assigned_driver_id UUID;
BEGIN
  SELECT p.area INTO order_area
  FROM public.daily_orders dor
  JOIN public.subscriptions s ON dor.subscription_id = s.id
  JOIN public.profiles p ON s.user_id = p.id
  WHERE dor.id = order_uuid;

  SELECT d.id INTO assigned_driver_id
  FROM public.drivers d
  WHERE d.assigned_area = order_area
    AND d.active = true
  ORDER BY (
    SELECT COUNT(*)
    FROM public.daily_orders do2
    WHERE do2.driver_id = d.id
    AND do2.delivery_date = (SELECT delivery_date FROM public.daily_orders WHERE id = order_uuid)
    AND do2.status IN ('preparing', 'out_for_delivery')
  ) ASC
  LIMIT 1;

  IF assigned_driver_id IS NOT NULL THEN
    UPDATE public.daily_orders
    SET driver_id = assigned_driver_id
    WHERE id = order_uuid;
  END IF;

  RETURN assigned_driver_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate views
CREATE OR REPLACE VIEW public.active_subscriptions_view AS
SELECT
  s.id,
  s.user_id,
  p.full_name as customer_name,
  p.phone as customer_phone,
  p.area,
  pkg.name as package_name,
  po.meals_per_day,
  po.days_per_month,
  po.days_per_week,
  s.start_date,
  s.end_date,
  s.selected_days,
  s.dietary_restrictions,
  s.total_price,
  s.paid
FROM public.subscriptions s
JOIN public.profiles p ON s.user_id = p.id
JOIN public.packages pkg ON s.package_id = pkg.id
JOIN public.package_options po ON s.package_option_id = po.id
WHERE s.status = 'active';

CREATE OR REPLACE VIEW public.daily_orders_view AS
SELECT
  dor.id,
  dor.delivery_date,
  dor.delivery_time_slot,
  dor.status,
  p.full_name as customer_name,
  p.phone as customer_phone,
  p.area as customer_area,
  dor.delivery_address,
  d.id as driver_id,
  dp.full_name as driver_name,
  d.phone as driver_phone,
  dor.meal_details,
  dor.driver_notified_at,
  dor.delivered_at,
  pkg.name as package_name
FROM public.daily_orders dor
JOIN public.subscriptions s ON dor.subscription_id = s.id
JOIN public.profiles p ON s.user_id = p.id
JOIN public.packages pkg ON s.package_id = pkg.id
LEFT JOIN public.drivers d ON dor.driver_id = d.id
LEFT JOIN public.profiles dp ON d.user_id = dp.id;

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dietary_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Done!
SELECT 'Migration fix completed successfully!' as status;
