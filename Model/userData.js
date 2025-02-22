import { mongoose, Schema } from "mongoose";

const transactionSchema = new mongoose.Schema({
  amount: Number,
  description: String,
  date: String, // Format: "2025-02-20"

  category: String, // e.g., "Shopping", "Meal"
  month: String, // Format: "2025-02"
});
const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
