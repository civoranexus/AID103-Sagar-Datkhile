-- Create tables
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('vendor', 'verifier', 'admin')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE vendors (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE verifiers (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT,
  employee_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE, -- References vendor (user) ID
  name TEXT NOT NULL,
  serial_number TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hashed_token TEXT UNIQUE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('active', 'used', 'revoked')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qr_id UUID REFERENCES qr_codes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  verifier_id UUID REFERENCES users(id) ON DELETE SET NULL,
  verifier_name TEXT,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  ip_address TEXT,
  location TEXT,
  result TEXT NOT NULL, -- valid, invalid, used
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
CREATE INDEX idx_logs_qr ON audit_logs(qr_id);
CREATE INDEX idx_logs_verifier ON audit_logs(verifier_id);
CREATE INDEX idx_logs_vendor ON audit_logs(vendor_id);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;

-- Policies
-- Helper function to avoid recursion in policies
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users: Everyone can read their own profile. Admins can read all.
CREATE POLICY "Users can view own profile and admins can view all" ON users FOR SELECT USING (
  auth.uid() = id OR is_admin()
);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Vendors: Vendors can view/edit their own profiles.
CREATE POLICY "Vendors can view own company" ON vendors FOR SELECT USING (id = auth.uid());
CREATE POLICY "Verifiers and Admins can view all vendors" ON vendors FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('verifier', 'admin'))
);
CREATE POLICY "Vendors can update own company" ON vendors FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Vendors can insert own company" ON vendors FOR INSERT WITH CHECK (id = auth.uid());

-- Verifiers: Verifiers can view/edit their own profiles.
CREATE POLICY "Verifiers can view own profile" ON verifiers FOR SELECT USING (id = auth.uid());
CREATE POLICY "Verifiers can insert own profile" ON verifiers FOR INSERT WITH CHECK (id = auth.uid());

-- Products: Vendors can manage their own products. Verifiers can view products.
CREATE POLICY "Vendors can manage own products" ON products FOR ALL USING (
  vendor_id = auth.uid()
);
CREATE POLICY "Verifiers can view all products" ON products FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('verifier', 'admin'))
);

-- QR Codes: Vendors can manage their own QR codes. Public can't read, but verifiers can search.
CREATE POLICY "Vendors can manage own QR codes" ON qr_codes FOR ALL USING (
  vendor_id = auth.uid()
);
CREATE POLICY "Verifiers can view QR codes" ON qr_codes FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('verifier', 'admin'))
);

-- Audit Logs: Vendors can see logs for their products. Verifiers can see their own scans.
CREATE POLICY "Vendors can view own QR logs" ON audit_logs FOR SELECT USING (
  vendor_id = auth.uid()
);
CREATE POLICY "Verifiers can view own scan history" ON audit_logs FOR SELECT USING (
  verifier_id = auth.uid()
);
CREATE POLICY "Verifiers can insert logs" ON audit_logs FOR INSERT WITH CHECK (
  verifier_id = auth.uid()
);
CREATE POLICY "Admins can view all logs" ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

