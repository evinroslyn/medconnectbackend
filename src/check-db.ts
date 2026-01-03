import * as dotenv from "dotenv";
import { parse } from "pg-connection-string";
import dns from "dns";
import { Pool } from "pg";

dotenv.config();

async function checkConnection() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error("❌ DATABASE_URL is not defined in .env");
        return;
    }

    console.log("🔍 Analyzing DATABASE_URL...");
    try {
        const config = parse(url);
        const port = parseInt(config.port || "5432");
        console.log(`📡 Host: ${config.host}`);
        console.log(`🔌 Port: ${port}`);
        console.log(`👤 User: ${config.user}`);
        console.log(`📂 Database: ${config.database}`);

        const hasSsl = url.includes("sslmode=require") || url.includes("sslmode=prefer") || url.includes("ssl=true");
        console.log(`🔒 SSL in URL: ${hasSsl ? "✅ Yes" : "❌ No"}`);

        if (config.host) {
            console.log(`\n🌐 Resolving ${config.host}...`);
            dns.lookup(config.host, { all: true }, async (err, addresses) => {
                if (err) {
                    console.error("❌ DNS Lookup failed:", err);
                    return;
                }
                console.log("✅ Resolved addresses:");
                addresses.forEach((addr) => {
                    console.log(`   - ${addr.address} (${addr.family === 4 ? 'IPv4' : 'IPv6'})`);
                });

                if (port === 5432) {
                    console.log("\n⚠️  Port 5432 detected (Direct Connection).");
                    console.log("   Supabase direct connections often require IPv6 or may be blocked by some networks.");
                } else if (port === 6543) {
                    console.log("\n✅ Port 6543 detected (Transaction Pooler).");
                    console.log("   High compatibility with IPv4 and better for serverless/pooled environments.");
                }

                console.log("\n⚡ Attempting a test connection...");
                const poolConfig: any = {
                    connectionString: url,
                    max: 1,
                    connectionTimeoutMillis: 5000,
                };

                if (hasSsl) {
                    poolConfig.ssl = { rejectUnauthorized: false };
                }

                const pool = new Pool(poolConfig);
                try {
                    const start = Date.now();
                    const client = await pool.connect();
                    const res = await client.query("SELECT VERSION()");
                    console.log(`✅ SUCCESS! Connected in ${Date.now() - start}ms`);
                    console.log(`📄 DB Version: ${res.rows[0].version}`);
                    client.release();
                } catch (connErr: any) {
                    console.error("❌ CONNECTION FAILED!");
                    console.error(`   Error code: ${connErr.code}`);
                    console.error(`   Message: ${connErr.message}`);

                    if (connErr.code === 'ETIMEDOUT') {
                        console.log("\n💡 Suggestions for ETIMEDOUT:");
                        console.log("   1. Double check your password and username in DATABASE_URL.");
                        console.log("   2. Ensure you are using PORT 6543 if your ISP/Network doesn't support IPv6.");
                        console.log("   3. Check that your local firewall/antivirus isn't blocking port 6543.");
                    } else if (connErr.message.includes('SSL')) {
                        console.log("\n💡 Suggestions for SSL errors:");
                        console.log("   1. Add '?sslmode=require' to your connection string.");
                    }
                } finally {
                    await pool.end();
                }
            });
        }
    } catch (error) {
        console.error("❌ Failed to parse DATABASE_URL:", error);
    }
}

checkConnection();
