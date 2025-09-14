import {useCallback, useEffect, useState} from "react";
import Filter from "./Filter.jsx";
import EditDish from "./EditDish.jsx";
import Pagination from "./Pagination";
import "../styles/DishList.css";

// rendering a single dish row within the table list
const Dish = (props) => {
    const formatDate = (date) => {
        if (!date) return "Never";

        const dateObj = new Date(date);
        return dateObj.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <tr>
            <td>{props.dish.name}</td>
            <td>{props.dish.cuisine}</td>
            <td>
                <span className={`last-eaten-date ${!props.dish.lastEaten ? 'never' : ''}`}>
                    {formatDate(props.dish.lastEaten)}
                </span>
            </td>
            <td>
                {props.dish.preferences && props.dish.preferences.length > 0 ? (
                    <div className="preferences-container">
                        {props.dish.preferences.map((pref, index) => (
                            <span key={index} className="preference-tag">
                                {pref.charAt(0).toUpperCase() + pref.slice(1)}
                            </span>
                        ))}
                    </div>
                ) : (
                    <span className="no-preferences">No preferences</span>
                )}
            </td>
            <td>
                <div className="actions-container">
                    <button
                        type="button"
                        onClick={() => props.onEdit(props.dish)}     // onEdit(): function to open edit dish modal
                        className="edit-link"
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        onClick={() => props.openDeleteConfirm(props.dish)}      // openDeleteConfirm(): function to open message to confirm delete
                        className="delete-button"
                    >
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default function DishList() {
    const [dishes, setDishes] = useState([]);             // unfiltered dishes
    const [searchTerm, setSearchTerm] = useState("");             // search input val
    const [isLoading, setIsLoading] = useState(false);
    const [filteredDishes, setFilteredDishes] = useState([]);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, dishId: null, dishName: "" });

    // modal states
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedDish, setSelectedDish] = useState(null);

    // pagination
    const [currentPage, setCurrentPage] = useState(1);
    const lastDishIndex = currentPage * 15;        // 15 dishes per page
    const firstDishIndex = lastDishIndex - 15;
    const currentDishes = filteredDishes.slice(firstDishIndex, lastDishIndex);
    const totalPages = Math.ceil(filteredDishes.length / 15);

    // modal button helpers preventing re-rendering infinite loop
    const openCreate = () => {
        setIsCreateOpen(true);
    };

    const closeCreate = () => {
        setIsCreateOpen(false);
    };

    // called when a dish is successfully created
    const handleDishCreated = (newDish) => {
        // validating required properties of the dish
        if (!newDish || !newDish._id || !newDish.name) {
            console.error("Invalid dish data received:", newDish);
            closeCreate();
            return;
        }

        // add properly formatted dish
        setDishes((prev) => {
            // check if dish exists to prevent accidental duplicates
            const exists = prev.some(dish => dish._id === newDish._id);
            if (exists) return prev;

            return [...prev, newDish];
        });

        closeCreate();
    };

    // fetching records from the db server, triggered when the search query changes
    useEffect(() => {
        async function getDishes() {
            setIsLoading(true);
            try {
                const url = searchTerm
                    ? `http://localhost:5050/record/search?name=${encodeURIComponent(searchTerm)}`
                    : `http://localhost:5050/record/`;

                const response = await fetch( url);
                if (!response.ok) {
                    const message = `An error occurred: ${response.statusText}`;
                    console.error(message);
                    return;
                }
                const data = await response.json();
                setDishes(data);
            } catch (error) {
                console.error("Fetch error:", error);
            } finally {
                setIsLoading(false);
            }
        }

        const debounceTimer = setTimeout(() => {      // avoiding rapid requests during typing
            getDishes();
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchTerm]);

    // receives filtered dishes from the Filter component
    const handleFilteredDishesChange = useCallback((filtered) => {
        if (searchTerm) {
            filtered = filtered.filter((dish) => {
                // make sure dish and dish.name exist before making lowercase
                if (!dish || !dish.name) return false;
                return dish.name.toLowerCase().includes(searchTerm.toLowerCase());
            });
        }

        setFilteredDishes(filtered);
    }, [searchTerm]);

    // resetting to page 1 whenever the filtering or sorting is changed
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filteredDishes.length]);

    const handlePageChange = (pageNum) => {
        setCurrentPage(pageNum);
        window.scrollTo({ top: 0, behavior: "smooth" });     // scroll up every time page changes
    };

    async function deleteDish(id) {
        try {
            const response = await fetch(`http://localhost:5050/record/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error(`Failed to delete dish: ${response.statusText}`);
            }

            const newDishes = dishes.filter((el) => el._id !== id);
            setDishes(newDishes);
            setDeleteConfirm({ isOpen: false, dishId: null, dishName: "" });       // close modal
        } catch (error) {
            console.error(error);
            window.alert("Failed to delete dish. Please try again.");
        }
    }

    const openDeleteConfirm = (dish) => {
        setDeleteConfirm({ isOpen: true, dishId: dish._id, dishName: dish.name });
    };

    // open/close modal
    const openEdit = (dish) => {
        setSelectedDish(dish);
        setIsEditOpen(true);
    };
    const closeEdit = () => {
        setIsEditOpen(false);
        setSelectedDish(null);
    };

    const handleDishSaved = (updated) => {
        setDishes((prev) => prev.map((d) => (d._id === updated._id ? updated : d)));
        closeEdit();
    };

    // map and rendering the table with each dish row
    function dishList() {
        return currentDishes.map((dish) => {
            return (
                <Dish
                    dish={dish}
                    onEdit={openEdit}
                    openDeleteConfirm={openDeleteConfirm}
                    key={dish._id}
                />
            );
        });
    }

    return (
        <div className="dish-list-container">
            <div>
                <div className="controls-container">
                    <button
                        onClick={openCreate}
                        className="btn primary"
                        style={{ marginLeft: 'auto' }}
                    >
                        + Add New Dish
                    </button>
                    <input
                        type="text"
                        placeholder="Search dishes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <Filter dishes={dishes} onFilteredDishesChange={handleFilteredDishesChange} />

                {!isLoading && filteredDishes.length > 0 && (
                    <div className="results-info">
                        Showing {firstDishIndex + 1}-
                        {Math.min(lastDishIndex, filteredDishes.length)} of {filteredDishes.length} dishes
                    </div>
                )}

                {isLoading ? (
                    <p className="loading-message">Loading dishes...</p>
                ) : (
                    <>
                        <table className="dishes-table">
                            <thead>
                            <tr>
                                <th>Name</th>
                                <th>Cuisine</th>
                                <th>Last Eaten</th>
                                <th>Preferences</th>
                                <th></th>
                            </tr>
                            </thead>
                            <tbody>
                            {currentDishes.length > 0 ? (
                                dishList()
                            ) : (
                                <tr>
                                    <td colSpan="5" className="empty-message">
                                        No dishes found matching your criteria.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    </>
                )}
                <EditDish
                    isOpen={isEditOpen}
                    onClose={closeEdit}
                    dish={selectedDish}
                    onSaved={handleDishSaved}
                    mode="edit"
                />
                <EditDish
                    isOpen={isCreateOpen}
                    onClose={closeCreate}
                    dish={null}
                    onSaved={handleDishCreated}
                    mode="create"
                />
            </div>

            {deleteConfirm.isOpen && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm({ isOpen: false, dishId: null, dishName: "" })}>
                    <div className="modal-card delete-confirm" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Confirm Delete</h3>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to delete <strong>{deleteConfirm.dishName}</strong>?</p>
                            <p className="warning-text">This action cannot be undone.</p>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn secondary"
                                onClick={() => setDeleteConfirm({ isOpen: false, dishId: null, dishName: "" })}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn danger"
                                onClick={() => deleteDish(deleteConfirm.dishId)}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}