import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema({
  month: {
    type: String,
    required: true,
    // Format: "YYYY-MM"
  },
  budgets: {
    Shopping: {
      limit: {
        type: Number,
        default: 0,
      },
      spent: {
        type: Number,
        default: 0,
      },
    },
    Meal: {
      limit: {
        type: Number,
        default: 0,
      },
      spent: {
        type: Number,
        default: 0,
      },
    },
    Movie: {
      limit: {
        type: Number,
        default: 0,
      },
      spent: {
        type: Number,
        default: 0,
      },
    },
    Other: {
      limit: {
        type: Number,
        default: 0,
      },
      spent: {
        type: Number,
        default: 0,
      },
    },
  },
});

const Budget = mongoose.model("Budget", budgetSchema);
export default Budget;
