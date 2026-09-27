import express from "express";
import * as analyticsController from "../controllers/analyticsController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(requireAuth);
router.get("/weekly", analyticsController.getWeekly);

export default router;
