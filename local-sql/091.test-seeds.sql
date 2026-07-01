-- -- local-sql/091.test-seeds.sql
-- -- Add your local development-only test data here.
--
-- IMPORTANT: files in local-sql/ run in postgres docker-entrypoint-initdb.d — i.e. at DB init,
-- BEFORE Prisma migrations create any application tables. So this file must NOT touch app tables
-- (users, user_devices, mqtt_user, …); those don't exist yet here. Seed application rows in the
-- POST-migration seed instead: prisma/seed.ts (run via `prisma db seed`, which the migrate
-- container runs after `migrate deploy`). The dev credential admin now lives there, driven by
-- OWNER_USERNAME / OWNER_PASSWORD.

-- INSERT INTO "users" ("id", "user_type", "user_role", "user_name", "password", "google_id", "email", "full_name", "profile_picture_url") VALUES
-- (1,	1,	'user',	NULL,	NULL,	'109859346308041406735',	'test@example.com',	'Test User',	'https://via.placeholder.com/150')
-- ON CONFLICT (id) DO NOTHING;

-- INSERT INTO "user_devices" ("id", "device_type_id", "user_id", "mac_id", "name") VALUES
-- (2,	1,	1, 'test-mac',	'Test Local Device')
-- ON CONFLICT (id) DO NOTHING;
