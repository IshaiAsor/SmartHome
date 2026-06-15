#!/bin/sh
set -e

# This script runs as the POSTGRES_USER (usually 'postgres')
# It ensures the database environment is ready before Prisma migrations run.

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- 1. Enable pgcrypto for password hashing
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    -- 2. Create the Backend Application User
    DO \$$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${BACKEND_DB_USER}') THEN
            CREATE USER ${BACKEND_DB_USER} WITH PASSWORD '${BACKEND_DB_PASSWORD}';
        END IF;
    END
    \$$;

    -- 3. Create the EMQX DB User
    DO \$$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${EMQX_DB_USERNAME}') THEN
            CREATE USER ${EMQX_DB_USERNAME} WITH PASSWORD '${EMQX_DB_PASSWORD}';
        END IF;
    END
    \$$;

    -- 4. Set Default Privileges
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${BACKEND_DB_USER};
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${BACKEND_DB_USER};
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO ${EMQX_DB_USERNAME};

    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${BACKEND_DB_USER};
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${BACKEND_DB_USER};
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO ${EMQX_DB_USERNAME};

    -- 5. Backward compatibility for roles hardcoded in migrations (app_user, emqx)
    DO \$$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') AND '${BACKEND_DB_USER}' != 'app_user' THEN
            CREATE USER app_user WITH PASSWORD '${BACKEND_DB_PASSWORD}';
        END IF;
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'emqx') AND '${EMQX_DB_USERNAME}' != 'emqx' THEN
            CREATE USER emqx WITH PASSWORD '${EMQX_DB_PASSWORD}';
        END IF;
    END
    \$$;

    -- Also grant to fallback roles if they exist
    DO \$$
    BEGIN
        IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
            GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
            GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
        END IF;
        IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'emqx') THEN
            GRANT SELECT ON ALL TABLES IN SCHEMA public TO emqx;
        END IF;
    END
    \$$;
EOSQL
