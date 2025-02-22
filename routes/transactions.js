import { Router } from "express";
import { transaction } from "../controllers/transaction.js";
import getTransaction from "../controllers/getTransaction.js";
import { getBudget, setBudget } from "../controllers/budget.js";
const router = Router();

router.route("/").post(transaction);
router.route("/transactions").get(getTransaction);
router.route("/budgets").post(setBudget);
router.route("/budgets/:month").get(getBudget);

export default router;
