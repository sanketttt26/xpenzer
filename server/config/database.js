import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new pg.Pool({
  user: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DATABASE,
  ssl: process.env.NODE_ENV === "production" ? true : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
});

const db = {
  query: async (sql, params) => {
    const client = await pool.connect();

    try {
      const result = await client.query(sql, params);
      return { result };
    } catch (error) {
      return { error };
    } finally {
      client.release();
    }
  },
};

export default db;
