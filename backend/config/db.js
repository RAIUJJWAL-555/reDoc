import mongoose from "mongoose";

// Connect to MongoDB using the URI from environment variables
// Falls back to a local MongoDB instance if MONGO_URI is not set
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || "mongodb://localhost:27017/redoc";
    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
