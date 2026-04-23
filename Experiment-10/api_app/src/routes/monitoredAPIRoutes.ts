import { Router } from "express";
import {
  createAPI,
  getAPIs,
  streamAPIs,
  deleteAPI,
  getApiHistoryController,
  getUptimeController
} from "../controllers/monitoredAPIController";
import { authenticate } from "../middleware/authMiddleware";
import { rateLimiter } from "../middleware/rateLimiter";

const router = Router();

// All routes protected
router.use(authenticate);
router.use(rateLimiter);

// CRUD + history + uptime
router.post("/monitored-apis", createAPI);
router.get("/monitored-apis", getAPIs);
router.get("/monitored-apis/stream", streamAPIs);
router.delete("/monitored-apis/:id", deleteAPI);
router.get("/monitored-apis/:id/history", getApiHistoryController);
router.get("/monitored-apis/:id/uptime", getUptimeController);

export default router;
