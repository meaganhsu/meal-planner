import Dish from '../models/Dish.js';

export const validateDishFields = (dishData, isUpdate = false) => {
    const errors = {};     // collecting validation errors
    const { name, ingredients, preferences } = dishData;

    // validating name (required for create, optional for update)
    if (name !== undefined) {
        if (!name || name.trim().length === 0) {           // check if name exists and is not empty
            errors.name = "Dish name is required.";
        } else if (name.trim().length < 2) {            // name min length requirement
            errors.name = "Dish name must be at least 2 characters.";
        } else if (name.trim().length > 70) {             // name max length requirement
            errors.name = "Dish name cannot exceed 70 characters.";
        }
    } else if (!isUpdate) errors.name = "Dish name is required.";

    // validating ingredients
    if (ingredients !== undefined) {
        if (!ingredients || ingredients.length === 0) {
            errors.ingredients = "Please select at least one ingredient.";
        }
    } else if (!isUpdate) errors.ingredients = "Please select at least one ingredient.";

    // validating preferences
    if (preferences !== undefined) {
        if (!preferences || preferences.length === 0) {
            errors.preferences = "Please select at least one preference.";
        }
    } else if (!isUpdate) errors.preferences = "Please select at least one preference.";

    return {
        isValid: Object.keys(errors).length === 0,
        errors: errors
    };
};

// helper function checking for duplicate dish names in the database
export const checkDuplicateDish = async (name, excludeId = null) => {
    if (!name) return false;

    const query = {      // query to find dishes with the same name (case-insensitive)
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    };

    // if excluding a specific dish (for updates), add id exclusion
    if (excludeId) query._id = { $ne: excludeId };

    const existingDish = await Dish.findOne(query);
    return Boolean(existingDish);
};

// function to normalise dish data before saving
export const normaliseDishData = (dishData) => {
    return {
        name: dishData.name ? dishData.name.trim() : '',       // removing white spaces
        cuisine: dishData.cuisine || "asian",             // default to 'asian' if cuisine is not provided
        ingredients: dishData.ingredients || [],      // default to empty array if not provided
        preferences: dishData.preferences || [],
        lastEaten: dishData.lastEaten || null
    };
};