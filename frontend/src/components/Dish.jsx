import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import Select from 'react-select';
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

export default function Dish() {
    const [form, setForm] = useState({
        name: "",
        cuisine: CuisineType.ASIAN,
        ingredients: [],
        preferences: [],
        lastEaten: ""
    });

    const [isNew, setIsNew] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const params = useParams();
    const navigate = useNavigate();
    const [errors, setErrors] = useState({});

    const ingredientOptions = Object.entries(IngredientType).map(([key, value]) => ({
        value,
        label: key.charAt(0).toUpperCase() + key.slice(1).toLowerCase().replace('_', ' ')
    }));

    // fetching dish data
    useEffect(() => {
        async function fetchData() {
            const id = params.id?.toString() || undefined;
            if (!id) {
                setIsLoading(false);
                return;
            }

            setIsNew(false);

            try {
                const response = await api.get(`/dishes/${params.id.toString()}`);
                const dish = response.data;

                if (!dish) {
                    console.warn(`Meal with id ${id} not found`);
                    navigate("/");
                    return;
                }

                setForm({
                    name: dish.name || "",
                    cuisine: dish.cuisine || CuisineType.ASIAN,
                    ingredients: Array.isArray(dish.ingredients) ? dish.ingredients : [],
                    preferences: Array.isArray(dish.preferences) ? dish.preferences : [],
                    lastEaten: dish.lastEaten || ""
                });
            } catch (error) {
                console.error("Error fetching dish:", error);
                navigate("/");
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [params.id, navigate]);

    function updateForm(value) {
        setForm((prev) => {
            return { ...prev, ...value };
        });
    }

    // handling submission to create or edit dish
    async function onSubmit(e) {
        e.preventDefault();

        setErrors({});

        // error handling and edge cases
        if (!form.name.trim()) {
            setErrors({ name: "Please enter a dish name." });
            return;
        }

        if (form.name.trim().length < 2) {
            setErrors({ name: "Dish name is too short." });
            return;
        }

        if (form.name.trim().length > 70) {
            setErrors({ name: "Dish name is too long." });
            return;
        }

        if (!form.ingredients || form.ingredients.length === 0) {
            setErrors({ ingredients: "Please select at least one ingredient." });
            return;
        }

        if (!form.preferences || form.preferences.length === 0) {
            setErrors({ preferences: "Please select at least one preference." });
            return;
        }

        const dishData = {
            name: form.name.trim(),
            cuisine: form.cuisine,
            ingredients: form.ingredients,
            preferences: form.preferences,
            lastEaten: form.lastEaten
        };

        try {
            if (isNew) {
                await api.post(`/dishes`, dishData);
            } else {
                await api.patch(`/dishes/${params.id}`, dishData);
            }

            navigate("/");
        } catch (e) {
            if (e.response) {
                const data = e.response.data;
                if (e.response.status === 409) {
                    setErrors({ name: data.message });
                } else if (e.response.status === 400) {
                    if (data.message.includes("ingredient")) {
                        setErrors({ ingredients: data.message });
                    } else if (data.message.includes("preference")) {
                        setErrors({ preferences: data.message });
                    } else {
                        setErrors({ name: data.message });
                    }
                } else {
                    console.error('A problem occurred adding or updating a meal: ', e);
                    alert("Failed to save dish. Please try again.");
                }
            } else {
                console.error('A problem occurred adding or updating a meal: ', e);
                alert("Failed to save dish. Please try again.");
            }
        }
    }

    // converting selected ingredient values for react-select
    const getSelectedIngredients = () => {
        if (!Array.isArray(form.ingredients)) return [];
        return ingredientOptions.filter(opt =>
            form.ingredients.includes(opt.value)
        );
    };

    // handling ingredient selection change
    const handleIngredientsChange = (selectedOptions) => {
        const ingredients = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
        updateForm({ ingredients });
        if (errors.ingredients) setErrors({...errors, ingredients: null});
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <>
            <h3>{isNew ? "Create New Dish" : "Update Dish"}</h3>
            <form onSubmit={onSubmit}>
                <div>
                    <div>
                        <h2>Dish Information</h2>
                    </div>

                    <div>
                        <div>
                            <label htmlFor="dish-name">
                                Dish Name
                            </label>
                            <div>
                                <input
                                    type="text"
                                    name="dish-name"
                                    id="dish-name"
                                    value={form.name}
                                    onChange={(e) => {
                                        updateForm({ name: e.target.value });
                                        if (errors.name) setErrors({...errors, name: null});
                                    }}
                                    required
                                />
                                {errors.name && <ErrorMsg message={errors.name} />}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="cuisine">Cuisine</label>
                            <div>
                                <select
                                    name="cuisine"
                                    id="cuisine"
                                    value={form.cuisine}
                                    onChange={(e) => updateForm({ cuisine: e.target.value })}
                                >
                                    {Object.entries(CuisineType).map(([key, value]) => (
                                        <option key={value} value={value}>
                                            {key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="ingredients">Ingredients</label>
                            <div>
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
                        </div>

                        <div className="container">
                            <label htmlFor="preferences">Preferences</label>
                            <div className="row" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                {Object.entries(FamilyMember).map(([key, value]) => {
                                    const isChecked = Array.isArray(form.preferences) && form.preferences.includes(value);
                                    return (
                                        <label
                                            key={value}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                userSelect: 'none',
                                                backgroundColor: isChecked ? '#d4f0ff' : '#f0f0f0'
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                name={value}
                                                value={value}
                                                style={{ marginRight: '0.5rem' }}
                                                checked={isChecked}
                                                onChange={() => {
                                                    const updatedPrefs = isChecked
                                                        ? form.preferences.filter(pref => pref !== value)
                                                        : [...form.preferences, value];
                                                    updateForm({ preferences: updatedPrefs });
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
                </div>
            </form>
        </>
    );
}