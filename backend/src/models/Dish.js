import mongoose from "mongoose";
import { CuisineType, FamilyMember, IngredientType } from "../utils/constants.js";

const DishSchema = new mongoose.Schema({
    name: { type: String, unique: true, required: true},
    cuisine: {
        type: String,
        required: true,
        enum: Object.values(CuisineType)
    },
    ingredients: {
        type: [String],
        required: true,
        enum: Object.values(IngredientType)
    },
    preferences: {
        type: [String],
        required: true,
        enum: Object.values(FamilyMember)
    },
    lastEaten: { type: Date, required: false },
}, {
    versionKey: false,
    collection: "dishes",
});

const Dish = mongoose.model("Dish", DishSchema);

export default Dish;