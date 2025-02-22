import Transaction from "../Model/userData.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Budget from "../Model/budget.js";

const transaction = asyncHandler(async (req, res, next) => {
  try {
    const { amount, description, date, category } = req.body;

    // Validate amount and convert to number
    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) {
      throw new Error("Invalid amount value");
    }

    // Extract month from date (YYYY-MM-DD -> YYYY-MM)
    const month = date.substring(0, 7);

    // Create transaction
    const createdTransaction = await Transaction.create({
      amount: numericAmount,
      description,
      category,
      date,
      month,
    });

    // Find or create budget for the month
    let budget = await Budget.findOne({ month });

    if (!budget) {
      // Create new budget if none exists
      budget = await Budget.create({
        month,
        budgets: {
          [category]: { limit: 0, spent: numericAmount }, // Initialize with current amount
        },
      });
    } else {
      // If budget exists but category doesn't, add category
      if (!budget.budgets[category]) {
        await Budget.updateOne(
          { month },
          {
            $set: {
              [`budgets.${category}`]: { limit: 0, spent: numericAmount },
            },
          }
        );
      } else {
        // Update existing category spent amount
        await Budget.updateOne(
          { month },
          {
            $set: {
              [`budgets.${category}.spent`]:
                budget.budgets[category].spent + numericAmount,
            },
          }
        );
      }
    }

    // Fetch the updated budget
    const updatedBudget = await Budget.findOne({ month });
    console.log("Updated Budget:", await Budget.findOne({ month }));

    return res.status(201).json({
      success: true,
      data: createdTransaction,
      message: "Transaction added successfully",
      updatedBudget: updatedBudget.budgets[category],
    });
  } catch (err) {
    console.error("❌ Error creating transaction:", err);
    return res.status(500).json({
      success: false,
      message: "Error creating transaction",
      error: err.message,
    });
  }
});

export { transaction };
