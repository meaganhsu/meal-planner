import express from "express";
import {
    createDish,
    deleteDish,
    getAllDishes,
    getDishesFromId,
    getDishesFromSearch,
    updateDish,
    updateLastEaten
} from "../controllers/dishesController.js";

const router = express.Router();

router.get("/", getAllDishes);
router.get("/search", getDishesFromSearch);
router.get("/:id", getDishesFromId);

router.post("/", createDish);

router.patch("/:id", updateDish);
router.patch("/:id/last-eaten", updateLastEaten);

router.delete("/:id", deleteDish);

export default router;