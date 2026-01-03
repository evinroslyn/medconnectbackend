import * as dotenv from "dotenv";
import path from "path";

// Load env
const result = dotenv.config({ path: path.resolve(__dirname, "../.env") });

console.log("Dotenv parsed:", result.parsed ? Object.keys(result.parsed) : "null");
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
    console.log("DATABASE_URL protocol:", new URL(process.env.DATABASE_URL).protocol);
} else {
    console.log("DATABASE_URL is undefined");
}
console.log("Current Directory:", process.cwd());
