-- -- local-sql/091.test-seeds.sql
-- -- Add your local development-only test data here.

-- INSERT INTO "users" ("id", "user_type", "user_role", "user_name", "password", "google_id", "email", "full_name", "profile_picture_url") VALUES
-- (1,	1,	'user',	NULL,	NULL,	'109859346308041406735',	'test@example.com',	'Test User',	'https://via.placeholder.com/150')
-- ON CONFLICT (id) DO NOTHING;

-- INSERT INTO "user_devices" ("id", "device_type_id", "user_id", "mac_id", "name") VALUES
-- (2,	1,	1, 'test-mac',	'Test Local Device')
-- ON CONFLICT (id) DO NOTHING;
