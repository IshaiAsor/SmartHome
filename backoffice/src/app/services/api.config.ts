import { environment } from 'src/environments/environment';

// Base URL for the new `api` service (F2). The v2.2 strangler migration repoints UI
// services off the monolith one surface at a time; each migrated service uses this base.
// Empty env value → derived at runtime as api.{hostname} in prod (same pattern the UI
// already uses for the device-gateway and socket-server subdomains).
export function apiV2Url(): string {
  return (
    environment.apiV2Url ||
    (environment.production ? `${window.location.protocol}//api.${window.location.hostname}` : 'http://localhost:3100')
  );
}
