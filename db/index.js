import sql from 'mssql';
import 'dotenv/config';

const sqlConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true, // Use this if you're on Azure
    trustServerCertificate: true, // Change to false for production connections
  },
};

let pool;

const connectDB = async () => {
  if (pool) {
    return pool;
  }
  try {
    pool = await sql.connect(sqlConfig);
    console.log('Connected to SQL Server');
    return pool;
  } catch (err) {
    console.error('Database connection failed:', err);
    // Prevent the app from starting or functioning without a DB connection
    process.exit(1);
  }
};

export const getDB = () => {
  if (!pool) {
    throw new Error('Database not connected. Call connectDB first.');
  }
  return pool;
};

export default connectDB;
