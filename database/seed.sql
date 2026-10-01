-- Seed the 4 plans for TMD dating app

INSERT INTO plans (name, slug, price_inr, duration_days, features, is_active) 
VALUES 
  ('Free', 'free', 0, NULL, '{"unlimited_messages": false, "swipes_per_day": 20, "see_who_likes_you": false, "advanced_filters": false}', true),
  ('Basic', 'basic_49', 4900, 15, '{"unlimited_messages": true, "swipes_per_day": 50, "see_who_likes_you": true, "advanced_filters": false}', true),
  ('Plus', 'plus_149', 14900, 15, '{"unlimited_messages": true, "swipes_per_day": 100, "see_who_likes_you": true, "advanced_filters": true, "priority_likes": true}', true),
  ('Pro', 'pro_499', 49900, 10, '{"unlimited_messages": true, "swipes_per_day": -1, "see_who_likes_you": true, "advanced_filters": true, "priority_likes": true, "read_receipts": true}', true)
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  price_inr = EXCLUDED.price_inr,
  duration_days = EXCLUDED.duration_days,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active;
