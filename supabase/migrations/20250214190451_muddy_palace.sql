-- Create merch orders table
CREATE TABLE merch_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_price DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded')),
  transaction_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  delivery_address JSONB NOT NULL
);

-- Enable RLS
ALTER TABLE merch_orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own orders"
  ON merch_orders FOR SELECT
  USING (auth.uid() = buyer_id);

CREATE POLICY "Users can create orders"
  ON merch_orders FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update their pending orders"
  ON merch_orders FOR UPDATE
  USING (auth.uid() = buyer_id AND status = 'pending');

-- Create function to check product stock
CREATE OR REPLACE FUNCTION check_product_stock(
  product_id UUID,
  requested_quantity INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  available_stock INTEGER;
BEGIN
  SELECT stock::INTEGER INTO available_stock
  FROM products
  WHERE id = product_id;

  RETURN available_stock >= requested_quantity;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check stock before order
CREATE OR REPLACE FUNCTION check_stock_before_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND NOT check_product_stock(NEW.product_id, NEW.quantity) THEN
    RAISE EXCEPTION 'Not enough stock available';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_stock_before_insert
  BEFORE INSERT ON merch_orders
  FOR EACH ROW
  EXECUTE FUNCTION check_stock_before_order();

CREATE TRIGGER check_stock_before_update
  BEFORE UPDATE ON merch_orders
  FOR EACH ROW
  WHEN (OLD.status != 'confirmed' AND NEW.status = 'confirmed')
  EXECUTE FUNCTION check_stock_before_order();

-- Create indexes
CREATE INDEX idx_merch_orders_buyer_id ON merch_orders(buyer_id);
CREATE INDEX idx_merch_orders_product_id ON merch_orders(product_id);
CREATE INDEX idx_merch_orders_status ON merch_orders(status);
CREATE INDEX idx_merch_orders_transaction_id ON merch_orders(transaction_id);