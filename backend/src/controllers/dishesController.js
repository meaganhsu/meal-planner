import Dish from "../models/Dish.js";
import { validateDishFields, checkDuplicateDish, normaliseDishData } from '../utils/dishValidation.js';
import mongoose from "mongoose";

export async function getAllDishes(_, res) {
    try {
        const dishes = await Dish.find();
        res.status(200).json(dishes);
    } catch (e) {
        console.error("error in getAllDishes method: ", e);
        res.status(500).json({ message: "internal server error" });
    }
}

export async function getDishesFromSearch(req, res) {
    try {
        const { q } = req.query;       // searching query parameter

        // checking if search query is provided
        if (!q || q.trim() === '') {
            return res.status(400).json({
                message: "search query is required"
            });
        }

        // searching for dishes with case-insensitive partial match
        const dishes = await Dish.find({
            name: { $regex: q.trim(), $options: 'i' }
        }).sort({ name: 1 });      // sorting alphabetically by name

        if (dishes.length === 0) {
            return res.status(404).json({
                message: "no dishes found matching your search",
                results: []
            });
        }

        res.status(200).json({
            message: "search successful",
            results: dishes
        });

    } catch (e) {
        console.error("error in getDishesFromSearch method: ", e);
        res.status(500).json({ message: "internal server error" });
    }
}

export async function getDishesFromId(req, res) {
    try {
        const dish = await Dish.findById(req.params.id);

        if (!dish) return res.status(404).json({ message: "dish not found" });

        res.status(200).json(dish);
    } catch (e) {
        console.error("error in getDishesFromId method: ", e);
        res.status(500).json({ message: "internal server error" });
    }
}

export async function createDish(req, res) {
    try {
        const { name, cuisine, ingredients, preferences } = req.body;

        // validating all required fields
        const validation = validateDishFields({ name, ingredients, preferences }, false);
        if (!validation.isValid) {
            return res.status(400).json({
                message: Object.values(validation.errors)[0]       // returning first error
            });
        }

        // checking for duplicates
        const isDuplicate = await checkDuplicateDish(name);
        if (isDuplicate) {
            return res.status(409).json({
                message: "Dish with this name already exists"
            });
        }

        // creating and saving dish
        const normalisedData = normaliseDishData({ name, cuisine, ingredients, preferences });
        const newDish = new Dish(normalisedData);
        await newDish.save();

        res.status(201).json({ message: "Dish created successfully", dish: newDish });

    } catch (e) {
        console.error("Error in createDish method: ", e);
        if (e.code === 11000) {
            return res.status(409).json({ message: "Dish with this name already exists" });
        }
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function updateDish(req, res) {
    try {
        const { id } = req.params;
        const updateFields = req.body;

        // validating id format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "invalid dish id format" });
        }

        // validating provided fields for update
        const validation = validateDishFields(updateFields, true);
        if (!validation.isValid) {
            return res.status(400).json({
                message: Object.values(validation.errors)[0]
            });
        }

        // validating current dish and check permissions
        const currentDish = await Dish.findById(id);
        if (!currentDish) {
            return res.status(404).json({ message: "dish not found" });
        }

        // checking duplicates only if name is being updated
        if (updateFields.name !== undefined) {
            const trimmedName = updateFields.name.trim();
            if (trimmedName.toLowerCase() !== currentDish.name.toLowerCase()) {
                const isDuplicate = await checkDuplicateDish(trimmedName, id);
                if (isDuplicate) {
                    return res.status(409).json({
                        message: "a dish with this name already exists"
                    });
                }
            }
        }

        const normalisedData = normaliseDishData(updateFields);

        // removing undefined fields to avoid overwriting with undefinedd
        Object.keys(normalisedData).forEach(key => {
            if (normalisedData[key] === undefined) {
                delete normalisedData[key];
            }
        });

        // updating dish
        const updatedDish = await Dish.findByIdAndUpdate(
            id,
            { $set: normalisedData },
            { new: true, runValidators: true }
        );

        res.status(200).json(updatedDish);

    } catch (e) {
        console.error("error in updateDish method: ", e);
        if (e.code === 11000) {
            return res.status(409).json({ message: "a dish with this name already exists" });
        }
        res.status(500).json({ message: "internal server error" });
    }
}

export async function updateLastEaten(req, res) {
    try {
        const { id } = req.params;
        const { lastEaten } = req.body;

        // validating id format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "invalid dish ID format" });
        }

        // validating that last eaten is provided
        if (!lastEaten) {
            // allowing null to clear the lastEaten date
            const updatedDish = await Dish.findByIdAndUpdate(
                id,
                { $set: { lastEaten: null } },
                { new: true }
            );

            return res.status(200).json({
                message: "last eaten date cleared successfully",
                dish: updatedDish
            });
        }

        const newDate = new Date(lastEaten);
        const today = new Date();
        today.setHours(23, 59, 59, 999);    // end of today

        // validating date format
        if (isNaN(newDate.getTime())) {
            return res.status(400).json({ message: "invalid date format" });
        }

        // only updating if the date is not in the future
        if (newDate > today) {
            return res.status(200).json({
                message: "date is in the future, last eaten not updated",
                skipped: true
            });
        }

        // finding the current dish
        const existingDish = await Dish.findById(id);
        if (!existingDish) {
            return res.status(404).json({ message: "dish not found" });
        }

        // updating the lastEaten date
        const updatedDish = await Dish.findByIdAndUpdate(
            id,
            { $set: { lastEaten: newDate } },
            { new: true }        // returning the updated document
        );

        res.status(200).json({
            message: "last eaten date updated successfully",
            newDate: newDate,
            dish: updatedDish
        });

    } catch (e) {
        console.error('error in updateLastEaten method:', e);
        res.status(500).json({
            message: "error updating last eaten date",
            error: e.message
        });
    }
}

export async function deleteDish(req, res) {
    try {
        const del = await Dish.findByIdAndDelete(req.params.id);
        if (!del) return res.status(404).json({ message: "dish not found" });
        res.status(200).json({ message: "dish deleted successfully" })
    } catch (e) {
        console.error("error in deleteDish method:", e);
        res.status(500).json({ message: "internal server error" });
    }
}