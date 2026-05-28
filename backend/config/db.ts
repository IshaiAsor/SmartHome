import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import config from './env.config';

const pool = new Pool({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  port: config.db.port,
});
const adapter = new PrismaPg(pool);

export default new PrismaClient({ adapter });
