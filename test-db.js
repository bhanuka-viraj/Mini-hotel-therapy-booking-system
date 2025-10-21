const { Client } = require("pg");
require("dotenv/config");

async function testConnection() {
  const client = new Client({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "autotradelk",
  });

  try {
    console.log("Attempting to connect to database...");
    console.log("Connection config:", {
      host: client.host,
      port: client.port,
      user: client.user,
      database: client.database,
      password: client.password ? "***" : "undefined",
    });

    await client.connect();
    console.log("Successfully connected to database!");

    const result = await client.query("SELECT version()");
    console.log("PostgreSQL version:", result.rows[0].version);

    await client.end();
  } catch (error) {
    console.error("Connection failed:", error.message);
  }
}

testConnection();
