import { Pool, QueryResult, QueryResultRow } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST ,
  user: process.env.DB_USER ,
  password: process.env.DB_PASSWORD ,
  database: process.env.DB_NAME ,
  port: 5432,
});

function query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

export default { query };