-- Healthy Club Database Schema
-- Initial migration for meal subscription service

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- PROFILES TABLE (extends auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer', 'driver', 'admin')) DEFAULT 'customer',
  address TEXT,
  area TEXT,
  building TEXT,
  flat_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_phone ON public.profiles(phone);
CREATE INDEX idx_profiles_area ON public.profiles(area) WHERE role = 'customer';

COMMENT ON TABLE public.profiles IS 'User profiles extending Supabase auth.users';
COMMENT ON COLUMN public.profiles.role IS 'User role: customer, driver, or admin';

-- =============================================
-- PACKAGES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE CHECK (name IN ('normal', 'keto', 'vegetarian', 'special')),
  description TEXT,
  image_url TEXT,
  base_price DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_packages_active ON public.packages(active);

COMMENT ON TABLE public.packages IS 'Meal packages: Normal, Keto, Vegetarian, Special';

-- =============================================
-- PACKAGE OPTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.package_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  meals_per_day INTEGER NOT NULL CHECK (meals_per_day IN (1, 2, 3)),
  days_per_month INTEGER NOT NULL CHECK (days_per_month IN (20, 24, 26)),
  days_per_week INTEGER NOT NULL CHECK (days_per_week IN (5, 6, 7)),
  price_modifier DECIMAL(10,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(package_id, meals_per_day, days_per_month, days_per_week)
);

CREATE INDEX idx_package_options_package_id ON public.package_options(package_id);
CREATE INDEX idx_package_options_active ON public.package_options(active);

COMMENT ON TABLE public.package_options IS 'Configurable subscription options per package';
COMMENT ON COLUMN public.package_options.price_modifier IS 'Price adjustment from base_price (can be positive or negative)';

-- =============================================
-- DIETARY OPTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.dietary_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('allergy', 'preference', 'restriction')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dietary_options_category ON public.dietary_options(category);
CREATE INDEX idx_dietary_options_active ON public.dietary_options(active);

COMMENT ON TABLE public.dietary_options IS 'Predefined dietary options for subscriptions';

-- =============================================
-- SUBSCRIPTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE RESTRICT,
  package_option_id UUID NOT NULL REFERENCES public.package_options(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  selected_days JSONB NOT NULL DEFAULT '[]'::jsonb,
  dietary_restrictions JSONB NOT NULL DEFAULT '{"allergies": [], "exclusions": []}'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'cancelled', 'expired')) DEFAULT 'active',
  total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
  paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT end_date_after_start CHECK (end_date > start_date)
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_dates ON public.subscriptions(start_date, end_date);
CREATE INDEX idx_subscriptions_active ON public.subscriptions(user_id, status) WHERE status = 'active';

COMMENT ON TABLE public.subscriptions IS 'Customer meal subscriptions';
COMMENT ON COLUMN public.subscriptions.selected_days IS 'Array of weekdays: ["monday", "tuesday", ...]';
COMMENT ON COLUMN public.subscriptions.dietary_restrictions IS '{"allergies": ["nuts"], "exclusions": ["dairy"]}';

-- =============================================
-- DRIVERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  assigned_area TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  current_lat DECIMAL(10,8),
  current_lng DECIMAL(11,8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_drivers_user_id ON public.drivers(user_id);
CREATE INDEX idx_drivers_area ON public.drivers(assigned_area);
CREATE INDEX idx_drivers_active ON public.drivers(active) WHERE active = true;

COMMENT ON TABLE public.drivers IS 'Delivery drivers';
COMMENT ON COLUMN public.drivers.phone IS 'WhatsApp notification number';

-- =============================================
-- DAILY ORDERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.daily_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  delivery_date DATE NOT NULL,
  delivery_time_slot TEXT,
  meal_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')) DEFAULT 'scheduled',
  delivery_address TEXT NOT NULL,
  driver_notified_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_daily_orders_subscription_id ON public.daily_orders(subscription_id);
CREATE INDEX idx_daily_orders_driver_id ON public.daily_orders(driver_id);
CREATE INDEX idx_daily_orders_delivery_date ON public.daily_orders(delivery_date);
CREATE INDEX idx_daily_orders_status ON public.daily_orders(status);
CREATE INDEX idx_daily_orders_driver_date ON public.daily_orders(driver_id, delivery_date) WHERE status IN ('preparing', 'out_for_delivery');

COMMENT ON TABLE public.daily_orders IS 'Daily meal orders generated from subscriptions';
COMMENT ON COLUMN public.daily_orders.meal_details IS '{"meals": [{"name": "Breakfast", "items": [...]}]}';

-- =============================================
-- WHATSAPP MESSAGES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.daily_orders(id) ON DELETE SET NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('order_notification', 'delivery_confirmation', 'reminder')),
  message_content TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')) DEFAULT 'pending',
  response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_messages_driver_id ON public.whatsapp_messages(driver_id);
CREATE INDEX idx_whatsapp_messages_order_id ON public.whatsapp_messages(order_id);
CREATE INDEX idx_whatsapp_messages_status ON public.whatsapp_messages(status);
CREATE INDEX idx_whatsapp_messages_pending ON public.whatsapp_messages(status, created_at) WHERE status = 'pending';

COMMENT ON TABLE public.whatsapp_messages IS 'WhatsApp message log for driver notifications';

-- =============================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================
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

-- =============================================
-- FUNCTION: Generate Daily Orders from Subscriptions
-- =============================================
CREATE OR REPLACE FUNCTION public.generate_daily_orders(target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(orders_created INTEGER, subscription_id UUID, order_id UUID) AS $$
DECLARE
  sub_record RECORD;
  day_of_week TEXT;
  new_order_id UUID;
  order_count INTEGER := 0;
BEGIN
  -- Get day of week (lowercase)
  day_of_week := LOWER(TO_CHAR(target_date, 'Day'));
  day_of_week := TRIM(day_of_week);

  -- Loop through active subscriptions
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
    -- Build delivery address
    DECLARE
      delivery_addr TEXT;
    BEGIN
      delivery_addr := CONCAT_WS(', ',
        sub_record.address,
        CASE WHEN sub_record.building IS NOT NULL THEN 'Building: ' || sub_record.building END,
        CASE WHEN sub_record.flat_number IS NOT NULL THEN 'Flat: ' || sub_record.flat_number END,
        sub_record.area
      );

      -- Insert daily order
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

COMMENT ON FUNCTION public.generate_daily_orders IS 'Generate daily orders for active subscriptions on a given date';

-- =============================================
-- FUNCTION: Auto-assign Driver by Area
-- =============================================
CREATE OR REPLACE FUNCTION public.auto_assign_driver_to_order(order_uuid UUID)
RETURNS UUID AS $$
DECLARE
  order_area TEXT;
  assigned_driver_id UUID;
BEGIN
  -- Get order area from subscription
  SELECT p.area INTO order_area
  FROM public.daily_orders dor
  JOIN public.subscriptions s ON dor.subscription_id = s.id
  JOIN public.profiles p ON s.user_id = p.id
  WHERE dor.id = order_uuid;

  -- Find available driver in that area
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

  -- Update order with driver
  IF assigned_driver_id IS NOT NULL THEN
    UPDATE public.daily_orders
    SET driver_id = assigned_driver_id
    WHERE id = order_uuid;
  END IF;

  RETURN assigned_driver_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.auto_assign_driver_to_order IS 'Auto-assign driver to order based on area and load balancing';

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dietary_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- PACKAGES POLICIES
CREATE POLICY "Everyone can view active packages"
  ON public.packages FOR SELECT
  USING (active = true OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage packages"
  ON public.packages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- PACKAGE OPTIONS POLICIES
CREATE POLICY "Everyone can view active package options"
  ON public.package_options FOR SELECT
  USING (active = true OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage package options"
  ON public.package_options FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- DIETARY OPTIONS POLICIES
CREATE POLICY "Everyone can view active dietary options"
  ON public.dietary_options FOR SELECT
  USING (active = true OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage dietary options"
  ON public.dietary_options FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- SUBSCRIPTIONS POLICIES
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own subscriptions"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all subscriptions"
  ON public.subscriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- DRIVERS POLICIES
CREATE POLICY "Drivers can view own profile"
  ON public.drivers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Drivers can update own profile"
  ON public.drivers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all drivers"
  ON public.drivers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- DAILY ORDERS POLICIES
CREATE POLICY "Users can view own orders"
  ON public.daily_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE id = daily_orders.subscription_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can view assigned orders"
  ON public.daily_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.drivers
      WHERE id = daily_orders.driver_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can update assigned orders"
  ON public.daily_orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.drivers
      WHERE id = daily_orders.driver_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all orders"
  ON public.daily_orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- WHATSAPP MESSAGES POLICIES
CREATE POLICY "Drivers can view own messages"
  ON public.whatsapp_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.drivers
      WHERE id = whatsapp_messages.driver_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all messages"
  ON public.whatsapp_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all messages"
  ON public.whatsapp_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- SEED DATA: Packages
-- =============================================
INSERT INTO public.packages (name, description, base_price, active) VALUES
  ('normal', 'Balanced meals with a variety of proteins, carbs, and vegetables', 120.00, true),
  ('keto', 'Low-carb, high-fat ketogenic diet meals', 150.00, true),
  ('vegetarian', 'Plant-based meals with no meat or fish', 110.00, true),
  ('special', 'Customized meals for specific dietary needs', 180.00, true)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- SEED DATA: Package Options
-- =============================================
DO $$
DECLARE
  pkg_id UUID;
  pkg_name TEXT;
BEGIN
  FOR pkg_name IN SELECT name FROM public.packages LOOP
    SELECT id INTO pkg_id FROM public.packages WHERE name = pkg_name;

    -- 1 meal per day variations
    INSERT INTO public.package_options (package_id, meals_per_day, days_per_month, days_per_week, price_modifier) VALUES
      (pkg_id, 1, 20, 5, 0),
      (pkg_id, 1, 24, 6, 10),
      (pkg_id, 1, 26, 6, 15);

    -- 2 meals per day variations
    INSERT INTO public.package_options (package_id, meals_per_day, days_per_month, days_per_week, price_modifier) VALUES
      (pkg_id, 2, 20, 5, 40),
      (pkg_id, 2, 24, 6, 50),
      (pkg_id, 2, 26, 6, 60);

    -- 3 meals per day variations
    INSERT INTO public.package_options (package_id, meals_per_day, days_per_month, days_per_week, price_modifier) VALUES
      (pkg_id, 3, 20, 5, 80),
      (pkg_id, 3, 24, 6, 95),
      (pkg_id, 3, 26, 7, 110);
  END LOOP;
END $$;

-- =============================================
-- SEED DATA: Dietary Options
-- =============================================
INSERT INTO public.dietary_options (name, category, active) VALUES
  -- Allergies
  ('Nuts', 'allergy', true),
  ('Dairy', 'allergy', true),
  ('Gluten', 'allergy', true),
  ('Shellfish', 'allergy', true),
  ('Eggs', 'allergy', true),
  ('Soy', 'allergy', true),
  ('Fish', 'allergy', true),

  -- Preferences
  ('No Spicy Food', 'preference', true),
  ('Low Sodium', 'preference', true),
  ('Low Sugar', 'preference', true),
  ('Halal Only', 'preference', true),
  ('Organic Preferred', 'preference', true),

  -- Restrictions
  ('No Red Meat', 'restriction', true),
  ('No Pork', 'restriction', true),
  ('No Seafood', 'restriction', true),
  ('No Poultry', 'restriction', true),
  ('Vegan', 'restriction', true),
  ('Paleo', 'restriction', true)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- HELPFUL VIEWS
-- =============================================

-- View: Active subscriptions with package details
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

-- View: Daily orders with customer and driver info
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

COMMENT ON VIEW public.active_subscriptions_view IS 'Active subscriptions with customer and package details';
COMMENT ON VIEW public.daily_orders_view IS 'Daily orders with customer, driver, and package information';

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
