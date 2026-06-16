-- Widen sensor_history.value from VarChar(255) to TEXT so it can hold image/camera
-- frame telemetry (base64), not just scalar sensor readings.
ALTER TABLE sensor_history ALTER COLUMN value TYPE TEXT;
