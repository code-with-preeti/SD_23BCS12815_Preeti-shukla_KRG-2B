import { Router } from "express";
import { getPublicStats } from "../controllers/publicController";

const router = Router();

router.get("/public/stats", getPublicStats);

export default router;

