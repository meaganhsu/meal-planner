import React, { useState, useEffect } from "react";
import "../styles/Filter.css";
import { CuisineType, FamilyMember, IngredientType } from "../lib/constants.js";

const Filter = ({ dishes, onFilteredDishesChange }) => {
    // filter states
    const [activeCuisine, setActiveCuisine] = useState("");
    const [selectedIngredients, setSelectedIngredients] = useState([]);
    const [selectedPreferences, setSelectedPreferences] = useState([]);

    // predefined arrays
    const cuisines = Object.values(CuisineType);
    const ingredients = Object.values(IngredientType);
    const preferences = Object.values(FamilyMember);

    // toggle functions
    const toggleIngredient = (ingredient) => {
        setSelectedIngredients(prev =>
            prev.includes(ingredient)
                ? prev.filter(i => i !== ingredient)       // remove ingredient
                : [...prev, ingredient]      // add ingredient
        );
    };

    const togglePreference = (preference) => {
        setSelectedPreferences(prev =>
            prev.includes(preference)
                ? prev.filter(p => p !== preference)     // remove preference
                : [...prev, preference]      // add preference
        );
    };

    // clear functions for individual filter tags
    const clearCuisine = () => setActiveCuisine("");
    const clearIngredients = () => setSelectedIngredients([]);
    const clearPreferences = () => setSelectedPreferences([]);
    const clearAllFilters = () => {
        setActiveCuisine("");
        setSelectedIngredients([]);
        setSelectedPreferences([]);
    };

    // check if any filters are active
    const hasActiveFilters = activeCuisine || selectedIngredients.length > 0 || selectedPreferences.length > 0;

    // apply filters whenever filter states/dishes change
    useEffect(() => {
        let filtered = [...dishes];

        if (activeCuisine) {      // filtering cuisine
            filtered = filtered.filter(dish =>
                dish.cuisine &&
                dish.cuisine.toLowerCase() === activeCuisine.toLowerCase()
            );
        }

        if (selectedIngredients.length > 0) {       // ingredients filter —> dish must include all ingredients selected
            filtered = filtered.filter(dish =>
                dish.ingredients &&
                selectedIngredients.every(ing =>
                    dish.ingredients.some(dishIng =>
                        dishIng.toLowerCase() === ing.toLowerCase()
                    )
                )
            );
        }

        if (selectedPreferences.length > 0) {      // preferences filter
            filtered = filtered.filter(dish =>
                dish.preferences &&
                selectedPreferences.every(pref =>
                    dish.preferences.includes(pref)
                )
            );
        }

        onFilteredDishesChange(filtered);      // passing filters back to parent
    }, [dishes, activeCuisine, selectedIngredients, selectedPreferences, onFilteredDishesChange]);

    return (
        <div className="filters-container">
            <div className="filter-group">
                <div className="filter-header">
                    <h4>Cuisine</h4>
                    {hasActiveFilters && (
                        <button className="clear-all-btn" onClick={clearAllFilters}>
                            Clear All Filters
                        </button>
                    )}
                </div>
                <div className="filter-options">
                    <button
                        className={`filter-btn ${activeCuisine === "" ? "active" : ""}`}
                        onClick={() => setActiveCuisine("")}>
                        All
                    </button>
                    {cuisines.map((cuisine) => (
                        <button
                            key={cuisine}
                            className={`filter-btn ${activeCuisine === cuisine ? "active" : ""}`}
                            onClick={() => setActiveCuisine(cuisine)}
                        >
                            {cuisine}
                        </button>
                    ))}
                    {activeCuisine && (
                        <button className="clear-group-btn" onClick={clearCuisine}>
                            Clear
                        </button>
                    )}
                </div>
            </div>

            <div className="filter-group">
                <div className="filter-header">
                    <h4>Ingredients</h4>
                </div>
                <div className="filter-options">
                    {ingredients.map((ingredient) => (
                        <button
                            key={ingredient}
                            className={`filter-btn ${selectedIngredients.includes(ingredient) ? "active" : ""}`}
                            onClick={() => toggleIngredient(ingredient)}
                        >
                            {ingredient}
                        </button>
                    ))}
                    {selectedIngredients.length > 0 && (
                        <button className="clear-group-btn" onClick={clearIngredients}>
                            Clear [{selectedIngredients.length}]
                        </button>
                    )}
                </div>
            </div>

            <div className="filter-group">
                <div className="filter-header">
                    <h4>Preferences</h4>
                </div>
                <div className="filter-options">
                    {preferences.map((preference) => {
                        const display = preference.charAt(0).toUpperCase() + preference.slice(1);
                        return (
                            <button
                                key={preference}
                                className={`filter-btn ${selectedPreferences.includes(preference) ? "active" : ""}`}
                                onClick={() => togglePreference(preference)}>
                                {display}
                            </button>
                        );
                    })}
                    {selectedPreferences.length > 0 && (
                        <button className="clear-group-btn" onClick={clearPreferences}>
                            Clear [{selectedPreferences.length}]
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Filter;