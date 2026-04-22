
// export default pool;
import { Pool } from "pg";
dotenv.config();
import * as dotenv from "dotenv";
console.log("DATABASE_URL:", process.env.DATABASE_URL);


dotenv.config();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Verify DB connection on startup
(async () => {
  try {
    const client = await pool.connect();
    console.log("✅ PostgreSQL (Supabase) connected");
    client.release();
  } catch (err) {
    console.error("❌ PostgreSQL connection failed:", err);
    process.exit(1);
  }
})();

export default pool;
