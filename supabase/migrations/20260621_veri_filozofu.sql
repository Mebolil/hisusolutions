-- product_id kolonu sales tablosuna (NULL kabul eder, mevcut verilere zarar vermez)
ALTER TABLE sales ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES products(id);
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id) WHERE deleted_at IS NULL;

-- Tahsilat Yaşlandırma için hız indexleri
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales(payment_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sales_due_date ON sales(due_date) WHERE deleted_at IS NULL;

-- Hayalet Müşteri RPC (büyük dataset'te performans için)
CREATE OR REPLACE FUNCTION get_ghost_customers(
  p_user_id uuid,
  p_days_threshold int DEFAULT 60
)
RETURNS TABLE(
  customer_id uuid,
  customer_name text,
  last_sale_date date,
  days_since int,
  lifetime_revenue numeric
)
LANGUAGE sql STABLE AS $$
  SELECT
    c.id AS customer_id,
    c.name AS customer_name,
    MAX(s.sale_date)::date AS last_sale_date,
    EXTRACT(DAY FROM NOW() - MAX(s.sale_date))::int AS days_since,
    COALESCE(SUM(s.total_amount), 0) AS lifetime_revenue
  FROM customers c
  LEFT JOIN sales s
    ON s.customer_id = c.id
    AND s.user_id = p_user_id
    AND s.deleted_at IS NULL
    AND s.status = 'aktif'
  WHERE c.user_id = p_user_id
    AND c.deleted_at IS NULL
  GROUP BY c.id, c.name
  HAVING MAX(s.sale_date) < NOW() - (p_days_threshold || ' days')::interval
      OR MAX(s.sale_date) IS NULL
  ORDER BY days_since DESC NULLS LAST;
$$;
