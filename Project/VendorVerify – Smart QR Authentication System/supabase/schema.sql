-- Create tables
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('vendor', 'verifier', 'admin')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  batch_id TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hashed_token TEXT UNIQUE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('active', 'used', 'revoked')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE verification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qr_id UUID REFERENCES qr_codes(id) ON DELETE CASCADE,
  ip_address TEXT,
  location TEXT,
  result TEXT CHECK (result IN ('success', 'failure', 'warning')),
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE security_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qr_id UUID REFERENCES qr_codes(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high')) DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX idx_qr_hashed_token ON qr_codes(hashed_token);
CREATE INDEX idx_products_vendor ON products(vendor_id);
CREATE INDEX idx_logs_qr ON verification_logs(qr_id);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users: Everyone can read their own profile
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);

-- Vendors: Vendors can view/edit their own profiles
CREATE POLICY "Vendors can view own company" ON vendors FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Vendors can update own company" ON vendors FOR UPDATE USING (user_id = auth.uid());

-- Products: Vendors can manage their own products. Verifiers can view products.
CREATE POLICY "Vendors can manage own products" ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM vendors WHERE vendors.id = products.vendor_id AND vendors.user_id = auth.uid())
);
CREATE POLICY "Verifiers can view all products" ON products FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('verifier', 'admin'))
);

-- QR Codes: Vendors can manage their own QR codes. Public can't read, but verifiers can search.
CREATE POLICY "Vendors can manage own QR codes" ON qr_codes FOR ALL USING (
  EXISTS (
    SELECT 1 FROM products 
    JOIN vendors ON products.vendor_id = vendors.id 
    WHERE products.id = qr_codes.product_id AND vendors.user_id = auth.uid()
  )
);
CREATE POLICY "Verifiers can view QR codes" ON qr_codes FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('verifier', 'admin'))
);

-- Verification Logs: Vendors can see logs for their products. Admins can see all.
CREATE POLICY "Vendors can view own QR logs" ON verification_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM qr_codes 
    JOIN products ON qr_codes.product_id = products.id
    JOIN vendors ON products.vendor_id = vendors.id
    WHERE qr_codes.id = verification_logs.qr_id AND vendors.user_id = auth.uid()
  )
);
CREATE POLICY "Admins can view all logs" ON verification_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Verifiers can insert logs" ON verification_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'verifier')
);
