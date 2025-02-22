import { asyncHandler } from "../utils/asyncHandler.js";
import Transaction from "../Model/userData.js";
import Budget from "../Model/budget.js";

const getTransaction = asyncHandler(async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1 });

    // Group transactions by month and category
    const monthlyTransactions = transactions.reduce((acc, transaction) => {
      const { month, category, amount } = transaction;

      if (!acc[month]) {
        acc[month] = {};
      }
      if (!acc[month][category]) {
        acc[month][category] = 0;
      }
      acc[month][category] += amount;
      return acc;
    }, {});

    // Update budgets for each month
    for (const [month, categories] of Object.entries(monthlyTransactions)) {
      let budget = await Budget.findOne({ month });

      if (budget) {
        const updatedBudgets = { ...budget.budgets };

        // Update spent amounts for each category
        Object.entries(categories).forEach(([category, spent]) => {
          if (!updatedBudgets[category]) {
            updatedBudgets[category] = { limit: 0, spent };
          } else {
            updatedBudgets[category].spent = spent;
          }
        });

        await Budget.findOneAndUpdate(
          { month },
          { budgets: updatedBudgets },
          { new: true }
        );
      }
    }

    return res.status(200).json({
      success: true,
      data: transactions,
      message: "Transactions fetched successfully!",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error fetching transactions",
      error: err.message,
    });
  }
});

export default getTransaction;
