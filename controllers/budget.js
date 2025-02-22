// budget.controller.js
import { asyncHandler } from "../utils/asyncHandler.js";
import Budget from "../Model/budget.js";
import Transaction from "../Model/userData.js";

const setBudget = asyncHandler(async (req, res) => {
  try {
    const { month, budgets } = req.body;
    if (Object.values(budgets).some((value) => value < 0)) {
      return res.status(400).json({
        success: false,
        message: "Budget limits cannot be negative",
      });
    }
    if (!month || !budgets) {
      return res.status(400).json({
        success: false,
        message: "Month and budget limits are required",
      });
    }

    // Find existing budget or create new one
    let budget = await Budget.findOne({ month });

    if (budget) {
      // Update existing budget limits
      Object.keys(budgets).forEach((category) => {
        if (budget.budgets[category]) {
          budget.budgets[category].limit = Number(budgets[category]) || 0;
        }
      });
    } else {
      // Create new budget document
      budget = new Budget({
        month,
        budgets: Object.fromEntries(
          Object.keys(budgets).map((category) => [
            category,
            { limit: Number(budgets[category]) || 0, spent: 0 },
          ])
        ),
      });
    }

    await budget.save();

    res.status(200).json({
      success: true,
      data: budget,
      message: "Budget limits updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error setting budget limits",
      error: error.message,
    });
  }
});

const getBudget = asyncHandler(async (req, res) => {
  try {
    const { month } = req.params;

    // Get the budget for the month
    let budget = await Budget.findOne({ month });

    // Get all transactions for the month
    const transactions = await Transaction.find({
      month: month,
    });

    // Calculate spent amounts from transactions
    const spentAmounts = transactions.reduce((acc, transaction) => {
      const category = transaction.category;
      acc[category] = (acc[category] || 0) + transaction.amount;
      return acc;
    }, {});

    // If budget exists, update spent amounts
    if (budget) {
      const updatedBudgets = {};

      // Update each category's spent amount
      Object.keys(budget.budgets).forEach((category) => {
        updatedBudgets[category] = {
          limit: budget.budgets[category].limit,
          spent: spentAmounts[category] || 0,
        };
      });

      // Add any new categories from transactions
      Object.keys(spentAmounts).forEach((category) => {
        if (!updatedBudgets[category]) {
          updatedBudgets[category] = {
            limit: 0,
            spent: spentAmounts[category],
          };
        }
      });

      // Update the budget document
      budget = await Budget.findOneAndUpdate(
        { month },
        { budgets: updatedBudgets },
        { new: true }
      );
    } else {
      // Create new budget if none exists
      const newBudgets = {};
      Object.keys(spentAmounts).forEach((category) => {
        newBudgets[category] = {
          limit: 0,
          spent: spentAmounts[category],
        };
      });

      budget = await Budget.create({
        month,
        budgets: newBudgets,
      });
    }

    return res.status(200).json({
      success: true,
      data: budget,
      message: "Budget fetched successfully",
    });
  } catch (err) {
    console.error("Error in getBudget:", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching budget",
      error: err.message,
    });
  }
});

export { setBudget, getBudget };
