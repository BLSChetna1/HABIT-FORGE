import express from "express";
import { body } from "express-validator";
import * as habitController from "../controllers/habitController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { handleValidationErrors } from "../middleware/validate.js";

const router = express.Router();

const habitValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Habit name is required")
    .isLength({ min: 1, max: 100 })
    .withMessage("Habit name must be between 1 and 100 characters"),
  body("icon")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Icon identifier too long"),
  body("category")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Category name too long"),
  handleValidationErrors
];

// All habit routes require authentication
router.use(requireAuth);

router.get("/", habitController.getHabits);
router.post("/", habitValidation, habitController.createHabit);
router.get("/:id", habitController.getHabit);
router.put("/:id", habitValidation, habitController.updateHabit);
router.delete("/:id", habitController.deleteHabit);
router.post("/:id/complete", habitController.completeHabit);
router.get("/:id/completions", habitController.getHabitCompletions);

export default router;
