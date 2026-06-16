// Shared Prisma client (F1.8). device-gateway needs DB access for provisioning upserts
// and device config reads — unlike mqtt-service, which is intentionally DB-free.
export { db } from '@lattice/prisma-client';
