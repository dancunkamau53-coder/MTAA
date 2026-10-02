const prisma = require("./lib/prisma");

async function main() {
  try {
    await prisma.$connect();
    console.log("✅ MTAA database connected successfully!");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
