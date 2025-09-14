import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import Multiselect from 'multiselect-react-dropdown';
import api from "../lib/axios";

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
        cuisine: "asian",
        ingredients: [],
        preferences: [],
        lastEaten: ""
    });

    const [isNew, setIsNew] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const params = useParams();
    const navigate = useNavigate();
    const [errors, setErrors] = useState({});

    const ingredientOptions = [     // predefined list of ingredient options
        { cat: 'Ingredients', key: 'red meat' },
        { cat: 'Ingredients', key: 'pork' },
        { cat: 'Ingredients', key: 'chicken' },
        { cat: 'Ingredients', key: 'seafood' },
        { cat: 'Ingredients', key: 'eggs' },
        { cat: 'Ingredients', key: 'bread' },
        { cat: 'Ingredients', key: 'noodles' },
        { cat: 'Ingredients', key: 'pasta' },
        { cat: 'Ingredients', key: 'rice' },
        { cat: 'Ingredients', key: 'soup' },
        { cat: 'Ingredients', key: 'vegetables' }
    ];

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
                const response = await api.get(`/dishes/${params.id.toString()}`);      // getting dish from object id
                const dish = response.data;

                if (!dish) {
                    console.warn(`Meal with id ${id} not found`);
                    navigate("/");
                    return;
                }

                setForm({
                    name: dish.name || "",
                    cuisine: dish.cuisine || "asian",
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


        // prepping for api request
        const dishData = {
            name: form.name.trim(),
            cuisine: form.cuisine,
            ingredients: form.ingredients,
            preferences: form.preferences,
            lastEaten: form.lastEaten
        };

        try {
            let res;
            if (isNew) {
                res = await api.post(`/dishes`, dishData);
            } else {
                res = await api.patch(`/dishes/${params.id}`, dishData);
            }

            // SUCCESS: redirect on successful creation/update
            navigate("/");
        } catch (e) {
            // ERROR HANDLING: axios wraps errors in e.response
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

    // calculating chosen ingredients only when form.ingredients changes
    const getSelectedIngredients = () => {
        if (!Array.isArray(form.ingredients)) return [];
        return ingredientOptions.filter(opt => form.ingredients.includes(opt.key));
    };

    if (isLoading) {     // showing loading state
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
                                        if (errors.name) setErrors({...errors, name: null});     // clearing errors when user starts typing
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
                                    <option value="asian">Asian</option>
                                    <option value="chinese">Chinese</option>
                                    <option value="japanese">Japanese</option>
                                    <option value="western">Western</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="ingredients">Ingredients</label>
                            <div>
                                <Multiselect
                                    displayValue="key"
                                    options={ingredientOptions}
                                    selectedValues={getSelectedIngredients()}
                                    onSelect={(selectedList) => {
                                        const ingredients = selectedList.map(item => item.key);
                                        updateForm({ ingredients });
                                        if (errors.ingredients) setErrors({...errors, ingredients: null});
                                    }}
                                    onRemove={(selectedList) => {
                                        const ingredients = selectedList.map(item => item.key);
                                        updateForm({ ingredients });
                                    }}
                                    placeholder="Select ingredients"
                                    showCheckbox={true}
                                />
                                {errors.ingredients && <ErrorMsg message={errors.ingredients} />}
                            </div>
                        </div>

                        <div className="container">
                            <label htmlFor="preferences">Preferences</label>
                            <div className="row" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                {["Hubert", "Cherry", "Haley", "Ryan", "Meagan"].map((member) => {
                                    const memberKey = member.toLowerCase();
                                    const isChecked = Array.isArray(form.preferences) && form.preferences.includes(memberKey);

                                    return (
                                        <label
                                            key={memberKey}
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
                                                name={memberKey}
                                                value={memberKey}
                                                style={{ marginRight: '0.5rem' }}
                                                checked={isChecked}
                                                onChange={() => {
                                                    const updatedPrefs = isChecked
                                                        ? form.preferences.filter(pref => pref !== memberKey)
                                                        : [...form.preferences, memberKey];
                                                    updateForm({ preferences: updatedPrefs });
                                                    if (errors.preferences) setErrors({...errors, preferences: null});
                                                }}
                                            />
                                            <span>{member.charAt(0).toUpperCase() + member.slice(1)}</span>
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