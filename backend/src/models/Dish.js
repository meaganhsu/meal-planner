import mongoose from "mongoose";

const DishSchema = new mongoose.Schema({
    name: { type: String, unique: true, required: true},
    cuisine: { type: String, required: true },
    ingredients: { type: Array, required: true },
    preferences: { type: Array, required: true },
    lastEaten: { type: Date, required: false },
}, {
    versionKey: false,
    collection: "dishes",
});

const Dish = mongoose.model("Dish", DishSchema);

export default Dish;