import express from "express";
import * as userController from "../controllers/userController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(requireAuth);
router.get("/me", userController.getMe);

export default router;
