require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const url = new URL(process.env.DATABASE_URL);

const pool = new Pool({
  host: "52.14.39.200",
  port: 5432,
  database: url.pathname.slice(1),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),

  ssl: {
    rejectUnauthorized: false,
  },

  options: "endpoint=ep-still-frost-b4fqn1cf",

  connectionTimeoutMillis: 15000,
});

pool.on("error", (error) => {
  console.error("❌ PostgreSQL Pool Error:", error);
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

module.exports = prisma;