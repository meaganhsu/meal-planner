import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import Filter from "./Filter.jsx";
import "../styles/DishSelection.css";

const DishSelection = ({
                           isOpen,    // modal visibility
                           onClose,
                           selectedSlot,
                           dishes,
                           onAddDish,
                           searchTerm,
                           setSearchTerm     // updating search filter
                       }) => {
    const [filteredDishes, setFilteredDishes] = useState([]);

    // apply search filter on top of filter component results
    useEffect(() => {
        // only applying search filter if there is a search term and filterable dishes
        if (searchTerm && filteredDishes.length > 0) {
            const searchFiltered = filteredDishes.filter(dish =>
                dish.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredDishes(searchFiltered);
        }
    }, [searchTerm]);

    if (!isOpen || !selectedSlot) return null;

    const handleFilteredChange = (filtered) => {
        if (searchTerm) {     // apply search filter if exists
            filtered = filtered.filter(dish =>
                dish.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        setFilteredDishes(filtered);
    };

    const formatLastEaten = (date) => {
        if (!date) return "Never";
        return format(new Date(date), 'MMM d, yyyy');
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Add dishes to {selectedSlot.meal} on {format(selectedSlot.date, 'PPP')}</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    <input
                        type="text"
                        placeholder="Search dishes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="modal-search"
                        autoFocus
                    />

                    <Filter
                        dishes={dishes}
                        onFilteredDishesChange={handleFilteredChange}
                    />

                    {filteredDishes.length > 0 && (
                        <div className="results-info">
                            {filteredDishes.length} dish{filteredDishes.length !== 1 ? 'es' : ''} found
                        </div>
                    )}

                    <div className="modal-dish-list">
                        {filteredDishes.length > 0 ? (
                            filteredDishes.map(dish => (
                                <div
                                    key={dish._id}
                                    className="modal-dish-option"
                                    onClick={() => onAddDish(dish)}
                                >
                                    <div className="dish-info">
                                        <div className="dish-name">{dish.name}</div>
                                        <div className="dish-details">
                                            {dish.cuisine && (
                                                <span className="dish-cuisine">{dish.cuisine}</span>
                                            )}
                                            <span className={`dish-last-eaten ${!dish.lastEaten ? 'never' : ''}`}>
                                                Last eaten: {formatLastEaten(dish.lastEaten)}
                                            </span>
                                        </div>
                                        {dish.preferences && dish.preferences.length > 0 && (
                                            <div className="dish-preferences">
                                                {dish.preferences.map((pref, index) => (
                                                    <span key={index} className="preference-tag">
                                                        {pref.charAt(0).toUpperCase() + pref.slice(1)}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-dishes">No dishes found</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DishSelection;