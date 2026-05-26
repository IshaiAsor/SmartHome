#!/bin/bash
set -e

# Create the EMQX DB user and the initial MQTT admin record
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- 1. Create the 'emqx' database role
    DO \$$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${EMQX_DB_USERNAME}') THEN
            CREATE USER ${EMQX_DB_USERNAME} WITH PASSWORD '${EMQX_DB_PASSWORD}';
        END IF;
    END
    \$$;

    -- 2. Ensure the mqtt_user table exists (Atlas will create it, but this ensures no race condition)
    CREATE TABLE IF NOT EXISTS mqtt_user (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(100) NOT NULL,
        is_superuser BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. Grant permissions to the 'emqx' user
    GRANT SELECT ON mqtt_user TO ${EMQX_DB_USERNAME};

    -- 4. Create the initial admin record for EMQX dashboard/auth
    -- We use pgcrypto (enabled in Atlas migration) to hash the password
    INSERT INTO mqtt_user (username, password_hash, is_superuser)
    VALUES (
        '${MQTT_APP_USERNAME}', 
        crypt('${MQTT_APP_PASSWORD}', gen_salt('bf')),
        true
    )
    ON CONFLICT (username) DO NOTHING;
EOSQL
