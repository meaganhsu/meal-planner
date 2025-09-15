import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Select from "react-select";
import "../styles/EditDish.css";
import api from "../lib/axios";
import { CuisineType, FamilyMember, IngredientType } from "../lib/constants.js";

const ErrorMsg = ({ message }) => (
    <div style={{
        color: "red",
        fontSize: "0.875rem",
        marginTop: "0.25rem",
        fontWeight: "500"
    }}>
        {message}
    </div>
);

export default function EditDish({ isOpen, onClose, dish, onSaved, mode = "edit" }) {
    const isNew = mode === "create";

    const [form, setForm] = useState({
        name: "",
        cuisine: CuisineType.ASIAN,
        ingredients: [],
        preferences: [],
        lastEaten: "",
    });
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const ingredientOptions = Object.entries(IngredientType).map(([key, value]) => ({
        value,
        label: key.charAt(0).toUpperCase() + key.slice(1).toLowerCase().replace('_', ' ')
    }));

    // initialise form data when modal opens / mode changes
    useEffect(() => {
        if (!isOpen) return;

        // populating form with existing dish data for edits
        if (isNew) {
            setForm({    // resetting form for new dish
                name: "",
                cuisine: CuisineType.ASIAN,
                ingredients: [],
                preferences: [],
                lastEaten: "",
            });
        } else if (dish) {
            setForm({     // populate form for editing
                name: dish.name || "",
                cuisine: dish.cuisine || CuisineType.ASIAN,
                ingredients: Array.isArray(dish.ingredients) ? dish.ingredients : [],
                preferences: Array.isArray(dish.preferences) ? dish.preferences : [],
                lastEaten: dish.lastEaten || "",
            });
        }
    }, [dish, isNew, isOpen]);

    // close on esc
    useEffect(() => {
        const onKeyDown = (e) => e.key === "Escape" && onClose();
        if (isOpen) document.addEventListener("keydown", onKeyDown);     // listener open when modal is open
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [isOpen, onClose]);

    // locking background scroll
    useEffect(() => {
        if (!isOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";     // disabling scroll on body
        return () => {
            document.body.style.overflow = prev;
        };
    }, [isOpen]);

    const updateForm = (value) => setForm((prev) => ({ ...prev, ...value }));

    const getSelectedIngredients = () => {
        if (!Array.isArray(form.ingredients)) return [];
        return ingredientOptions.filter(opt =>
            form.ingredients.includes(opt.value)
        );
    };

    // handling ingr selection change
    const handleIngredientsChange = (selectedOptions) => {
        const ingredients = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
        updateForm({ ingredients });
        if (errors.ingredients) setErrors({...errors, ingredients: null});
    };

    const onSubmit = async (e) => {
        e.preventDefault();

        setErrors({});    // clearing errors

        // error handling and edge cases
        if (!form.name.trim()) {      // name cannot be empty
            setErrors({ name: "Please enter a dish name." });
            return;
        }

        if (form.name.trim().length < 2) {      // name must be greater than 2 chars
            setErrors({ name: "Dish name is too short." });
            return;
        }

        if (form.name.trim().length > 70) {      // name must be less than 70 chars
            setErrors({ name: "Dish name is too long." });
            return;
        }

        if (!form.ingredients || form.ingredients.length === 0) {      // must select at least one key ingredient
            setErrors({ ingredients: "Please select at least one ingredient." });
            return;
        }

        if (!form.preferences || form.preferences.length === 0) {      // must select at least one preference
            setErrors({ preferences: "Please select at least one preference." });
            return;
        }

        const dishData = {
            name: form.name.trim(),
            cuisine: form.cuisine,
            ingredients: form.ingredients,
            preferences: form.preferences,
            lastEaten: form.lastEaten,
        };

        try {
            setIsSaving(true);
            let response;

            if (isNew) {
                response = await api.post(`/dishes`, dishData);
            } else {
                response = await api.patch(`/dishes/${dish._id}`, dishData);
            }

            // success --> response.data contains the dish data
            onSaved(response.data);
            onClose();
        } catch (err) {
            if (err.response) {
                const responseData = err.response.data;
                if (err.response.status === 409) {
                    setErrors({ name: responseData.message || "A dish with this name already exists." });
                } else if (err.response.status === 400) {
                    if (responseData.message.includes("ingredient")) {
                        setErrors({ ingredients: responseData.message });
                    } else if (responseData.message.includes("preference")) {
                        setErrors({ preferences: responseData.message });
                    } else {
                        setErrors({ name: responseData.message });
                    }
                } else {
                    console.error(`Failed to ${isNew ? 'create' : 'update'} dish:`, err);
                    alert(`Failed to ${isNew ? 'create' : 'save'} dish. Please try again.`);
                }
            } else {
                console.error(`Failed to ${isNew ? 'create' : 'update'} dish:`, err);
                alert(`Failed to ${isNew ? 'create' : 'save'} dish. Please try again.`);
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;
    if (!isNew && !dish) return null;

    const modal = (
        <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{isNew ? "Create New Dish" : "Edit Dish"}</h3>
                    <button className="icon-button" onClick={onClose} aria-label="Close">✕</button>
                </div>

                <form onSubmit={onSubmit} className="modal-body">
                    <div className="section">
                        <div className="field">
                            <label htmlFor="dish-name">Dish Name</label>
                            <input
                                type="text"
                                id="dish-name"
                                value={form.name}
                                onChange={(e) => {
                                    updateForm({ name: e.target.value });
                                    if (errors.name) setErrors({...errors, name: null});
                                }}
                                required
                                autoFocus={isNew}
                            />
                            {errors.name && <ErrorMsg message={errors.name} />}
                        </div>

                        <div className="field">
                            <label htmlFor="cuisine">Cuisine</label>
                            <select
                                id="cuisine"
                                value={form.cuisine}
                                onChange={(e) => {updateForm({ cuisine: e.target.value })}}
                            >
                                {Object.entries(CuisineType).map(([key, value]) => (
                                    <option key={value} value={value}>
                                        {key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="field">
                            <label>Ingredients</label>
                            <Select
                                isMulti
                                options={ingredientOptions}
                                value={getSelectedIngredients()}
                                onChange={handleIngredientsChange}
                                placeholder="Select ingredients..."
                                className="react-select-container"
                                classNamePrefix="react-select"
                            />
                            {errors.ingredients && <ErrorMsg message={errors.ingredients} />}
                        </div>

                        <div className="field">
                            <label>Preferences</label>
                            <div className="prefs-row">
                                {Object.entries(FamilyMember).map(([key, value]) => {
                                    const isChecked = Array.isArray(form.preferences) && form.preferences.includes(value);
                                    return (
                                        <label key={value} className={`pref-pill ${isChecked ? "checked" : ""}`}>
                                            <input
                                                type="checkbox"
                                                value={value}
                                                checked={isChecked}
                                                onChange={() => {
                                                    const updated = isChecked
                                                        ? form.preferences.filter((p) => p !== value)
                                                        : [...form.preferences, value];
                                                    updateForm({ preferences: updated });
                                                    if (errors.preferences) setErrors({...errors, preferences: null});
                                                }}
                                            />
                                            <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                                        </label>
                                    );
                                })}
                            </div>
                            {errors.preferences && <ErrorMsg message={errors.preferences} />}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn secondary" onClick={onClose} disabled={isSaving}>
                            Cancel
                        </button>
                        <button type="submit" className="btn primary" disabled={isSaving}>
                            {isSaving ? "Saving..." : (isNew ? "Create Dish" : "Update Dish")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    const target = document.getElementById("modal-root") || document.body;
    return createPortal(modal, target);
}