-- build_items.product_id is intentionally a soft reference.
-- The FK created in V7 means catalog deletes would cascade-break historical builds.
ALTER TABLE build_items DROP CONSTRAINT IF EXISTS fk_build_items_product;
