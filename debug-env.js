const dotenv = require("dotenv");

// Load env
const result = dotenv.config();

console.log("Dotenv parsed keys:", result.parsed ? Object.keys(result.parsed) : "null");
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
    console.log("DATABASE_URL value:", process.env.DATABASE_URL);
    console.log("DATABASE_URL length:", process.env.DATABASE_URL.length);
    console.log("First 50 chars:", process.env.DATABASE_URL.substring(0, 50));
    console.log("Last 10 chars:", process.env.DATABASE_URL.substring(process.env.DATABASE_URL.length - 10));
    try {
        const url = new URL(process.env.DATABASE_URL);
        console.log("✅ DATABASE_URL is valid");
        console.log("Protocol:", url.protocol);
        console.log("Host:", url.hostname);
    } catch (e) {
        console.log("❌ DATABASE_URL is invalid:", e.message);
    }
} else {
    console.log("DATABASE_URL is undefined");
}
