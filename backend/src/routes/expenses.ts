import { Router } from 'express';
import {
  getAllCategories,
  createCategory,
  deleteCategory,
  getAllEstimates,
  createEstimate,
  updateEstimate,
  deleteEstimate,
  getAllExpenses,
  createExpense,
  confirmPayment,
  getDebtsSummary,
  deleteExpense
} from '../controllers/expensesController';

const router = Router();

// Categories
router.get('/categories', getAllCategories);
router.post('/categories', createCategory);
router.delete('/categories/:id', deleteCategory);

// Estimates
router.get('/estimates', getAllEstimates);
router.post('/estimates', createEstimate);
router.patch('/estimates/:id', updateEstimate);
router.delete('/estimates/:id', deleteEstimate);

// Expenses (Real)
router.get('/expenses', getAllExpenses);
router.post('/expenses', createExpense);
router.delete('/expenses/:id', deleteExpense);
router.patch('/expenses/confirm-payment', confirmPayment);

// Summary
router.get('/debts-summary', getDebtsSummary);

export default router;
