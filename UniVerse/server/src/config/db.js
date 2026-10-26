import mongoose from 'mongoose';
import dns from 'dns';

/**
 * Connect to MongoDB Atlas or local MongoDB instance
 */
export const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    const errorMsg = 'CRITICAL: MONGO_URI is not set in environment variables.';
    console.error(`[Database Error] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  // Use system DNS resolver by default for reliable SRV lookups

  // Mask URI credentials in logs to prevent password leakage
  const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
  console.log(`[Database] Attempting connection to MongoDB (${maskedUri})...`);

  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: true, // Build indexes defined in schemas
      dbName: process.env.DB_NAME || 'universe',
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
    });

    console.log(`[Database] MongoDB connected successfully to host: ${conn.connection.host} (DB: ${conn.connection.name})`);
    return conn;
  } catch (error) {
    console.error(`\n[Database Error] Connection failed: ${error.message}`);

    if (error.message.includes('querySrv') || error.message.includes('ENOTFOUND')) {
      console.error('\n--- MongoDB Atlas SRV Diagnostic Guide ---');
      console.error('1. Cluster Provisioning: If you recently created this cluster, Atlas typically takes 2-5 minutes to complete DNS deployment.');
      console.error('2. Cluster Paused: If the cluster was created earlier, verify in the MongoDB Atlas dashboard that it is not "Paused". Click "Resume" if needed.');
      console.error('3. Network Access: In Atlas -> Network Access, ensure you have added IP Address `0.0.0.0/0` (Allow Access from Anywhere).');
      console.error('4. Hostname: Double check that the cluster identifier matches your Atlas dashboard under "Connect" -> "Drivers".\n');
    }

    throw error;
  }
};

/**
 * Get current database connection status for health checks
 */
export const getConnectionStatus = () => {
  const state = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return {
    status: states[state] || 'unknown',
    isConnected: state === 1,
    host: state === 1 ? mongoose.connection.host : null,
    name: state === 1 ? mongoose.connection.name : null,
  };
};

/**
 * Close database connection gracefully
 */
export const closeDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('[Database] MongoDB connection closed gracefully.');
  } catch (err) {
    console.error(`[Database Error] Error during connection closure: ${err.message}`);
  }
};
