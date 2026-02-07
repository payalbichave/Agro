const mongoose = require('mongoose');

// Guessed Standard Connection String (Direct to Shard 00)
// This bypasses the SRV lookup ("+srv") which is failing.
// We try to connect to the first shard directly.
const directUri = "mongodb://agroagent:agroagent123@cluster0-shard-00-00.o8nfo.mongodb.net:27017,cluster0-shard-00-01.o8nfo.mongodb.net:27017,cluster0-shard-00-02.o8nfo.mongodb.net:27017/agroagent?ssl=true&replicaSet=atlas-o8nfo-shard-0&authSource=admin&retryWrites=true&w=majority";

// Fallback: Try just the first node as standalone if replica set name is wrong
const standaloneUri = "mongodb://agroagent:agroagent123@cluster0-shard-00-00.o8nfo.mongodb.net:27017/agroagent?ssl=true&authSource=admin";

async function testDirectConnection() {
    console.log("--------------- MongoDB Direct Connection Test ---------------");

    // Test 1: Direct Replica Set (Guessing RS name)
    // Note: The 'o8nfo' part of the domain is often the identifier for the shard names too.
    try {
        console.log("Test 4: Direct Connection (Bypassing SRV)...");
        // We constructed this URI based on standard Atlas patterns for 'cluster0.o8nfo.mongodb.net'
        const uriToTest = "mongodb://agroagent:agroagent123@cluster0-shard-00-00.o8nfo.mongodb.net:27017,cluster0-shard-00-01.o8nfo.mongodb.net:27017,cluster0-shard-00-02.o8nfo.mongodb.net:27017/agroagent?ssl=true&authSource=admin";

        console.log("Trying: " + uriToTest);

        await mongoose.connect(uriToTest, { serverSelectionTimeoutMS: 5000 });
        console.log("✅ SUCCESS! Direct connection confirmed.");

        console.log("\n>>> SOLUTION FOUND: Update .env with this new URI.");
        await mongoose.disconnect();
        process.exit(0);
    } catch (e) {
        console.log("❌ Test 4 Failed:", e.code || e.message);
    }

    process.exit(1);
}

testDirectConnection();
