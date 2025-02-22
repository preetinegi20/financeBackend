import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import userRouter from "./routes/transactions.js";
import Transaction from "./Model/userData.js";
import Budget from "./Model/budget.js";

dotenv.config();

const app = express();
app.use(express.json());

const allowedOrigins = [
  "http://localhost:5175",
  "https://financebackend-mamc.onrender.com",
  "https://personalfinanceapplication.netlify.app",
  "http://localhost:3000",
];
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      console.log("Blocked origin:", origin);
      return callback(new Error("CORS policy restriction"), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  exposedHeaders: ["Set-Cookie"],
  maxAge: 86400,
};
app.use(cors(corsOptions));

// Transaction update endpoint
app.put("/api/transactions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const originalTransaction = await Transaction.findById(id);

    if (!originalTransaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    // Update transaction
    const updateTransaction = await Transaction.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    // Update budget spent amounts if amount or category changed
    if (
      originalTransaction.amount !== req.body.amount ||
      originalTransaction.category !== req.body.category
    ) {
      const month = originalTransaction.date.substring(0, 7);
      const budget = await Budget.findOne({ month });

      if (budget) {
        // Remove old amount from original category
        if (budget.budgets[originalTransaction.category]) {
          budget.budgets[originalTransaction.category].spent -=
            originalTransaction.amount;
        }

        // Add new amount to new category
        if (budget.budgets[req.body.category]) {
          budget.budgets[req.body.category].spent += Number(req.body.amount);
        }

        await budget.save();
      }
    }

    const transactions = await Transaction.find().sort({ date: -1 });
    res.json({ success: true, data: transactions });
  } catch (err) {
    console.error("Error updating transaction:", err);
    res.status(500).json({
      success: false,
      message: "Error updating transaction",
      error: err.message,
    });
  }
});

// Transaction delete endpoint
app.delete("/api/transactions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    // Update budget spent amount before deleting transaction
    const month = transaction.date.substring(0, 7);
    const budget = await Budget.findOne({ month });

    if (budget && budget.budgets[transaction.category]) {
      budget.budgets[transaction.category].spent -= transaction.amount;
      await budget.save();
    }

    await Transaction.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (err) {
    console.error("Error while deleting transaction:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

// Budget endpoints
app.get("/api/budgets/:month", async (req, res) => {
  try {
    const { month } = req.params;
    const budget = await Budget.findOne({ month });

    if (!budget) {
      return res.json({
        budgets: {
          Shopping: { limit: 0, spent: 0 },
          Meal: { limit: 0, spent: 0 },
          Movie: { limit: 0, spent: 0 },
          Other: { limit: 0, spent: 0 },
        },
      });
    }

    res.json({ budgets: budget.budgets });
  } catch (error) {
    console.error("Error fetching budget:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/budgets", async (req, res) => {
  try {
    const { month, budgets } = req.body;

    if (!month || !budgets) {
      return res.status(400).json({ message: "Invalid data received" });
    }

    let budget = await Budget.findOne({ month });

    if (budget) {
      // Update existing budget
      Object.keys(budgets).forEach((category) => {
        budget.budgets[category] = {
          limit: Number(budgets[category]) || 0,
          spent: budget.budgets[category]?.spent || 0,
        };
      });

      await budget.save();
      res.status(200).json({ message: "Budget updated successfully" });
    } else {
      // Create new budget
      const newBudget = new Budget({
        month,
        budgets: Object.fromEntries(
          Object.keys(budgets).map((category) => [
            category,
            { limit: Number(budgets[category]) || 0, spent: 0 },
          ])
        ),
      });

      await newBudget.save();
      res.status(201).json({ message: "Budget created successfully" });
    }
  } catch (error) {
    console.error("Error saving budget:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.use("/api", userRouter);

const port = process.env.PORT || 5000;
const mongoUrl = `${process.env.MONGO_URL}${process.env.DB_NAME}`;

const mongoConn = async () => {
  try {
    await mongoose.connect(mongoUrl);
    console.log("DB CONNECTED SUCCESSFULLY");
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

mongoConn().then(() =>
  app.listen(port, () => console.log(`App is listening on port ${port}`))
);
