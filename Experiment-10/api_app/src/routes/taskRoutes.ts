import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";
import {
  getTasks,
  createTask,
  deleteTask,
} from "../controllers/taskController";

const router = Router();

router.use(authenticate); 

router.get("/", getTasks);
router.post("/", createTask);
router.delete("/:id", deleteTask);

export default router;
