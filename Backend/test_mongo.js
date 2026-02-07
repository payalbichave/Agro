const mongoose = require('mongoose');
const dns = require('node:dns');

const uri = "mongodb+srv://agroagent:agroagent123@cluster0.o8nfo.mongodb.net/agroagent?retryWrites=true&w=majority";

async function testConnection() {
    console.log("--------------- MongoDB Diagnostic ---------------");

    // Test 1: Default
    try {
        console.log("Test 1: Standard Connection...");
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
        console.log("✅ Custom DNS NOT needed. (Disconnecting...)");
        await mongoose.disconnect();
        return;
    } catch (e) {
        console.log("❌ Test 1 Failed:", e.code || e.message);
    }

    // Test 2: IPv4 Force
    try {
        console.log("\nTest 2: Force IPv4 (family: 4)...");
        await mongoose.connect(uri, { family: 4, serverSelectionTimeoutMS: 2000 });
        console.log("✅ IPv4 Force Worked!");
        await mongoose.disconnect();
        return;
    } catch (e) {
        console.log("❌ Test 2 Failed:", e.code || e.message);
    }

    // Test 3: Google DNS + IPv4
    try {
        console.log("\nTest 3: Google DNS (8.8.8.8) + IPv4...");
        dns.setServers(['8.8.8.8', '8.8.4.4']);
        dns.setDefaultResultOrder('ipv4first');
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
        console.log("✅ Google DNS Worked!");
        await mongoose.disconnect();
        return;
    } catch (e) {
        console.log("❌ Test 3 Failed:", e.code || e.message);
    }

    console.log("\n--------------------------------------------------");
    console.log("⚠️ ALL CONNECTION ATTEMPTS FAILED. Check Internet/Firewall.");
    process.exit(1);
}

testConnection();
