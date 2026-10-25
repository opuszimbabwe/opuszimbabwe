-- Keep paid orders reserved even when a supplier/eligibility issue needs support.
DROP INDEX IF EXISTS domain_order_active_name;
CREATE UNIQUE INDEX domain_order_active_name ON domain_orders(domain_name) WHERE state IN ('PAYMENT_PENDING','PAID','REGISTERING','UNCONFIRMED','REGISTERED','PRICE_CHANGED','ACTION_REQUIRED','REGISTRATION_FAILED');
