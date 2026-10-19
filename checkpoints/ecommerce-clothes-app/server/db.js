import 'dotenv/config';
import mongoose from 'mongoose';

let connection;
export const hasDatabase = () => Boolean(process.env.MONGODB_URI);
export async function connectDatabase() {
  if (!hasDatabase()) return false;
  if (mongoose.connection.readyState === 1) return true;
  if (!connection) {
    connection = mongoose
      .connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000, maxPoolSize: 5 })
      .catch((error) => {
        connection = undefined;
        throw error;
      });
  }
  await connection;
  return true;
}
