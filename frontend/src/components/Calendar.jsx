import React, { useState, useEffect } from "react";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isAfter, isBefore, subWeeks, addWeeks, startOfDay } from "date-fns";
import DishSelection from "../components/DishSelection";
import "../styles/Calendar.css";
import api from "../lib/axios";

const Calendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [weekDays, setWeekDays] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [dishes, setDishes] = useState([]);
    const [mealPlan, setMealPlan] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [weekStart, setWeekStart] = useState("");
    const [swapMode, setSwapMode] = useState(false);
    const [swapSource, setSwapSource] = useState(null);
    const [activeMenu, setActiveMenu] = useState(null);
    const [allWeekPlans, setAllWeekPlans] = useState({});

    // modal states
    const [showDishModal, setShowDishModal] = useState(false);
    const [modalSearchTerm, setModalSearchTerm] = useState("");

    const getWeekStart = (date) => {     // calculating the current week mon
        const startDate = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        setWeekStart(startDate);
        return startDate;
    };

    const today = new Date();

    // check if previous week navigation is allowed
    const canGoPrev = () => {
        const minAllowedWeek = startOfWeek(subWeeks(today, 2), { weekStartsOn: 1 });
        const targetWeek = startOfWeek(addDays(currentDate, -7), { weekStartsOn: 1 });
        return targetWeek.getTime() >= minAllowedWeek.getTime();
    };

    // check if next week navigation is allowed
    const canGoNext = () => {
        const maxDate = startOfWeek(addWeeks(today, 2), { weekStartsOn: 1 });
        const nextWeekStart = startOfWeek(addDays(currentDate, 7), { weekStartsOn: 1 });
        return nextWeekStart <= maxDate;
    };

    // check if a date is editable
    const editDate = (date) => {
        const todayStart = startOfDay(new Date());
        const dateStart = startOfDay(date);
        return dateStart >= todayStart;
    };

    // fetching dishes from api
    useEffect(() => {
        async function fetchDishes() {
            try {
                const response = await api.get('/dishes/');
                setDishes(response.data);
            } catch (e) {
                console.error("Error fetching dishes:", e);
            }
        }
        fetchDishes();
    }, []);

    // fetch meal plan for current week
    const fetchMealPlan = async (date) => {
        setIsLoading(true);
        try {
            const weekStartDate = getWeekStart(date);
            const planData = await fetchMealPlanForWeek(weekStartDate);
            setMealPlan(planData);
            setAllWeekPlans(prev => ({ ...prev, [weekStartDate]: planData }));
        } catch (e) {
            console.error("Error fetching meal plan:", e);
        } finally {
            setIsLoading(false);
        }
    };

    // fetch meal plan for a specific week
    const fetchMealPlanForWeek = async (weekStartDate) => {
        try {
            const response = await api.get(`/calendar/${weekStartDate}`);
            const data = response.status === 404 ? { lunch: {}, dinner: {} } : response.data;
            return {
                weekStart: weekStartDate,
                lunch: data.lunch || {},
                dinner: data.dinner || {}
            };
        } catch (e) {
            if (e.response?.status === 404) {
                return { weekStart: weekStartDate, lunch: {}, dinner: {} };
            }
            console.error("Error fetching meal plan:", e);
            return { weekStart: weekStartDate, lunch: {}, dinner: {} };
        }
    };

    // load meal plan when week changes
    useEffect(() => {
        fetchMealPlan(currentDate);
    }, [currentDate]);

    // generate weekdays when the current date changes
    useEffect(() => {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        const end = endOfWeek(currentDate, { weekStartsOn: 1 });
        const days = eachDayOfInterval({ start, end });
        setWeekDays(days);
    }, [currentDate]);

    // save meal plan to archive
    const saveMealPlan = async (updatedMealPlan) => {
        try {
            await api.post(`/calendar`, {
                weekStart: updatedMealPlan.weekStart,
                lunch: updatedMealPlan.lunch,
                dinner: updatedMealPlan.dinner
            });
        } catch (error) {
            console.error("Error saving meal plan:", error);
        }
    };

    // handling slot selection
    const handleSlotClick = (day, meal) => {
        if (!editDate(day)) return;     // ignoring clicks on days before current day

        if (swapMode && swapSource) {         // if in swap mode, then clicking will activate the swap
            handleSwapComplete(day, meal);
        } else {                              // otherwise clicking the slot will open the modal for dish selection
            setSelectedSlot({date: day, meal});
            setShowDishModal(true);
        }
        setActiveMenu(null);
    };

    const toggleMenu = (e, dateKey, mealType) => {
        e.stopPropagation();     // prevent triggering slot click
        const menuKey = `${dateKey}-${mealType}`;
        setActiveMenu(activeMenu === menuKey ? null : menuKey);
    };

    const handleSwapStart = (day, meal) => {
        setSwapMode(true);
        setSwapSource({date: day, meal, weekStart: weekStart});
        setSelectedSlot(null);
        setActiveMenu(null);
    };

    const handleSwapComplete = async (targetDay, targetMeal) => {
        if (!swapSource) return;

        // fetch both week plans involved in the swap
        let sourcePlan = getWeekStart(swapSource.date) === weekStart ? mealPlan : allWeekPlans[getWeekStart(swapSource.date)];
        let targetPlan = getWeekStart(targetDay) === weekStart ? mealPlan : allWeekPlans[getWeekStart(targetDay)];

        if (!sourcePlan) sourcePlan = await fetchMealPlanForWeek(getWeekStart(swapSource.date));
        if (!targetPlan && getWeekStart(targetDay) !== getWeekStart(swapSource.date)) targetPlan = await fetchMealPlanForWeek(getWeekStart(targetDay));

        // get dishes from both slots
        const sourceDishes = sourcePlan[swapSource.meal.toLowerCase()]?.[format(swapSource.date, 'yyyy-MM-dd')] || [];
        const targetDishes = (getWeekStart(targetDay) === getWeekStart(swapSource.date) ? sourcePlan : targetPlan)
            [targetMeal.toLowerCase()]?.[format(targetDay, 'yyyy-MM-dd')] || [];

        // updating source week plan
        const updatedSourcePlan = {
            ...sourcePlan,
            [swapSource.meal.toLowerCase()]: {
                ...sourcePlan[swapSource.meal.toLowerCase()],
                [format(swapSource.date, 'yyyy-MM-dd')]: targetDishes
            }
        };

        let updatedTargetPlan;
        if (getWeekStart(targetDay) === getWeekStart(swapSource.date)) {        // swapping in the same week
            updatedTargetPlan = {
                ...updatedSourcePlan,
                [targetMeal.toLowerCase()]: {
                    ...updatedSourcePlan[targetMeal.toLowerCase()],
                    [format(targetDay, 'yyyy-MM-dd')]: sourceDishes
                }
            };
            await saveMealPlan(updatedTargetPlan);
            if (getWeekStart(swapSource.date) === weekStart) setMealPlan(updatedTargetPlan);
            setAllWeekPlans(prev => ({ ...prev, [getWeekStart(swapSource.date)]: updatedTargetPlan }));
        } else {
            updatedTargetPlan = {        // swapping across different weeks
                ...targetPlan,
                [targetMeal.toLowerCase()]: {
                    ...targetPlan[targetMeal.toLowerCase()],
                    [format(targetDay, 'yyyy-MM-dd')]: sourceDishes
                }
            };
            await saveMealPlan(updatedSourcePlan);
            await saveMealPlan(updatedTargetPlan);

            if (getWeekStart(swapSource.date) === weekStart) setMealPlan(updatedSourcePlan);
            if (getWeekStart(targetDay) === weekStart) setMealPlan(updatedTargetPlan);
            setAllWeekPlans(prev => ({
                ...prev,
                [getWeekStart(swapSource.date)]: updatedSourcePlan,
                [getWeekStart(targetDay)]: updatedTargetPlan
            }));
        }

        await swappedUpdateLastEaten(sourceDishes, targetDay, targetDishes, swapSource.date);

        // resetting swap mode
        setSwapMode(false);
        setSwapSource(null);
    };

    // update last eaten dates after swap
    const swappedUpdateLastEaten = async (sourceDishes, targetDate, targetDishes, sourceDate) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (targetDate <= today) {      // updating last eaten for dishes moved to past dates
            for (const dishId of sourceDishes) {
                await updateLastEaten(dishId, targetDate);
            }
        }

        if (sourceDate <= today) {     // updating last eaten for dishes moved from past dates
            for (const dishId of targetDishes) {
                await updateLastEaten(dishId, sourceDate);
            }
        }
    };

    const cancelSwap = () => {      // cancelling ongoing swap
        setSwapMode(false);
        setSwapSource(null);
    };

    const addDishToSlot = async (dish) => {
        if (!selectedSlot) return;

        const dateKey = format(selectedSlot.date, 'yyyy-MM-dd');
        const mealType = selectedSlot.meal.toLowerCase();

        // checking the maximum dishes per slot
        const currDishes = mealPlan[mealType][dateKey] || [];
        if (currDishes.length >= 5) {
            alert("Maximum of 5 dishes per slot reached.");
            return;
        }

        // checking for duplicate dishes
        if (currDishes.includes(dish._id)) {
            alert("This dish is already added to this meal.");
            return;
        }

        const updatedMealPlan = {
            ...mealPlan,
            [mealType]: {
                ...mealPlan[mealType],
                [dateKey]: [...currDishes, dish._id]
            }
        };

        setMealPlan(updatedMealPlan);
        await saveMealPlan(updatedMealPlan);

        // only updating lastEaten if the dish is added to today or a past date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const slotDate = new Date(selectedSlot.date);
        slotDate.setHours(0, 0, 0, 0);

        if (slotDate <= today) {
            await updateLastEaten(dish._id, selectedSlot.date);
        }
    };

    // update dish last eaten date in the database
    const updateLastEaten = async (dishId, date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const mealDate = new Date(date);
        mealDate.setHours(0, 0, 0, 0);

        // only update lastEaten for past/current dates not future dates
        if (mealDate <= today) {
            try {
                const response = await api.patch(`/dishes/${dishId}/last-eaten`, {
                    lastEaten: date.toISOString()
                });

                // checking if the update was successful (not skipped)
                if (!response.data.skipped) {
                    const dish = dishes.find(d => d._id === dishId);
                    if (dish) {
                        const updatedDishes = dishes.map(d =>
                            d._id === dishId
                                ? { ...d, lastEaten: date }
                                : d
                        );
                        setDishes(updatedDishes);
                    }
                }

            } catch (error) {
                console.error("Error updating last eaten date:", error);
            }
        }
    };

    // remove dish from meal slot
    const removeDishFromSlot = async (dateKey, mealType, dishId) => {
        const date = new Date(dateKey);
        if (!editDate(date)) return;     // prevent editing previous dates

        const updatedMealPlan = {
            ...mealPlan,
            [mealType]: {
                ...mealPlan[mealType],
                [dateKey]: (mealPlan[mealType][dateKey] || []).filter(id => id !== dishId)
            }
        };

        setMealPlan(updatedMealPlan);
        await saveMealPlan(updatedMealPlan);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const mealDate = new Date(dateKey);
        mealDate.setHours(0, 0, 0, 0);

        // if removing from today's slot recalculate lastEaten
        if (mealDate.getTime() === today.getTime()) {
            // checking if the dish still exists in any of today's slots
            const stillExistsToday = ['lunch', 'dinner'].some(meal => {
                const dishesInSlot = updatedMealPlan[meal][dateKey] || [];
                return dishesInSlot.includes(dishId);
            });

            // if the dish is completely removed from today, recalculate lastEaten
            if (!stillExistsToday) await recalculateLastEaten(dishId);
        }

        setActiveMenu(null);
    };

    const recalculateLastEaten = async (dishId) => {
        try {
            console.log(`Recalculating lastEaten for dish: ${dishId}`);

            // first try to get the last occurrence from the server
            try {
                const response = await api.get(`/calendar/dish-last-occurrence/${dishId}`);
                if (response.data.lastEatenDate) {
                    const lastEatenDate = new Date(response.data.lastEatenDate);
                    console.log(`Found last occurrence from server: ${lastEatenDate}`);

                    // updating the lastEaten date
                    await updateLastEaten(dishId, lastEatenDate);
                    return;
                } else {
                    console.log("No last occurrence found in server search");
                }
            } catch (e) {
                console.log("Server search failed, falling back to client search:", e);
            }

            // fallback search through loaded weeks
            let mostRecentDate = null;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // search function to check a meal plan
            const searchInMealPlan = (plan, planWeekStart) => {
                for (const mealType of ['lunch', 'dinner']) {
                    for (const [dateKey, dishIds] of Object.entries(plan[mealType] || {})) {
                        if (Array.isArray(dishIds) && dishIds.includes(dishId)) {
                            const date = new Date(dateKey);
                            date.setHours(0, 0, 0, 0);

                            // only consider past dates (not today or future)
                            if (date < today && (!mostRecentDate || date > mostRecentDate)) {
                                mostRecentDate = date;
                                console.log(`Found occurrence in ${planWeekStart}: ${dateKey}`);
                            }
                        }
                    }
                }
            };

            searchInMealPlan(mealPlan, weekStart);      // checking the current week

            for (const [weekStartKey, weekPlan] of Object.entries(allWeekPlans)) {   // check other loaded weeks
                if (weekStartKey !== weekStart) {
                    searchInMealPlan(weekPlan, weekStartKey);
                }
            }

            if (mostRecentDate) {
                console.log(`Using most recent date: ${mostRecentDate}`);
                await updateLastEaten(dishId, mostRecentDate);
            } else {
                // if no previous date found then clear the last eaten date
                console.log("No past occurrences found, clearing lastEaten");
                try {
                    await api.patch(`/dishes/${dishId}/last-eaten`, {
                        lastEaten: null
                    });

                    const updatedDishes = dishes.map(d =>       // updating local state
                        d._id === dishId
                            ? { ...d, lastEaten: undefined }
                            : d
                    );
                    setDishes(updatedDishes);
                } catch (e) {
                    console.error("Error clearing last eaten date:", e);
                }
            }
        } catch (e) {
            console.error("Error recalculating last eaten date:", e);
        }
    };

    const clearSlot = async (dateKey, mealType) => {
        const date = new Date(dateKey);
        if (!editDate(date)) return;

        // get the removed dishes
        const removedDishIds = mealPlan[mealType][dateKey] || [];

        const updatedMealPlan = {
            ...mealPlan,
            [mealType]: {
                ...mealPlan[mealType],
                [dateKey]: []
            }
        };

        setMealPlan(updatedMealPlan);
        await saveMealPlan(updatedMealPlan);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const mealDate = new Date(dateKey);
        mealDate.setHours(0, 0, 0, 0);

        // if clearing today's slot, check each removed dish
        if (mealDate.getTime() === today.getTime()) {
            for (const dishId of removedDishIds) {
                // check if the dish still exists in the other meal slot today
                const otherMealType = mealType === 'lunch' ? 'dinner' : 'lunch';
                const existsInOtherSlot = (updatedMealPlan[otherMealType][dateKey] || []).includes(dishId);

                // if the dish does not exist in any of todays slots, recalculate
                if (!existsInOtherSlot) await recalculateLastEaten(dishId);
            }
        }

        setActiveMenu(null);
    };

    // close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActiveMenu(null);
        if (activeMenu) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [activeMenu]);

    // close modal
    const closeDishModal = () => {
        setShowDishModal(false);
        setSelectedSlot(null);
        setModalSearchTerm("");
    };

    const formatDateRange = () => {
        if (weekDays.length === 0) return "";
        const start = weekDays[0];
        const end = weekDays[weekDays.length - 1];

        if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
            return `${format(start, 'd')}-${format(end, 'd MMM, yyyy')}`;
        } else if (start.getFullYear() === end.getFullYear()) {
            return `${format(start, 'd MMM')}-${format(end, 'd MMM, yyyy')}`;
        }
        return `${format(start, 'd MMM, yyyy')} - ${format(end, 'd MMM, yyyy')}`;
    };

    const prevWeek = () => {
        if (canGoPrev()) {
            setCurrentDate(addDays(currentDate, -7));
        }
    };

    const nextWeek = () => {
        if (canGoNext()) {
            setCurrentDate(addDays(currentDate, 7));
        }
    };

    const goToToday = () => setCurrentDate(new Date());

    const getDishName = (dishId) => {
        const dish = dishes.find(d => d._id === dishId);
        return dish ? dish.name : 'Unknown Dish';
    };

    return (
        <div className="calendar-container">
            <div className="calendar-header">
                <button
                    onClick={prevWeek}
                    className="nav-button"
                    disabled={!canGoPrev()}
                >
                    Previous
                </button>

                <div className="header-center">
                    <h2>{formatDateRange()}</h2>
                    <button onClick={goToToday} className="today-button">
                        Go to Today
                    </button>
                </div>

                <button
                    onClick={nextWeek}
                    className="nav-button"
                    disabled={!canGoNext()}
                >
                    Next
                </button>
            </div>

            {swapMode && (
                <div className="swap-mode-banner">
                    <span>Swap mode: Select a destination slot for {swapSource.meal} on {format(swapSource.date, 'PPP')}</span>
                    <button onClick={cancelSwap} className="cancel-swap-btn">Cancel</button>
                </div>
            )}

            {isLoading ? (
                <div className="loading">Loading meal plan...</div>
            ) : (
                <>
                    <div className="calendar-grid">
                        <div className="weekdays-row">
                            <div className="time-label"></div>
                            {weekDays.map((day) => (
                                <div
                                    key={day.toString()}
                                    className={`day-header ${isToday(day) ? 'today' : ''} ${!editDate(day) ? 'past-date' : ''}`}
                                >
                                    <div className="weekday-name">{format(day, 'EEE')}</div>
                                    <div className="day-number">{format(day, 'd')}</div>
                                </div>
                            ))}
                        </div>

                        {['lunch', 'dinner'].map((mealType) => (
                            <div key={mealType} className="time-slot-row">
                                <div className="time-label">
                                    {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                                </div>
                                {weekDays.map((day) => {
                                    const dateKey = format(day, 'yyyy-MM-dd');
                                    const dishIds = mealPlan[mealType]?.[dateKey] || [];
                                    const isEditable = editDate(day);
                                    const menuKey = `${dateKey}-${mealType}`;

                                    return (
                                        <div
                                            key={`${day.toString()}-${mealType}`}
                                            className={`day-cell ${isToday(day) ? 'today' : ''} ${!isEditable ? 'past-date non-editable' : ''} ${swapMode ? 'swap-mode' : ''}`}
                                            onClick={() => !swapMode && isEditable && handleSlotClick(day, mealType)}
                                        >
                                            {dishIds.length > 0 && isEditable && !swapMode && (
                                                <div className="slot-menu-container">
                                                    <button
                                                        className="kebab-menu-btn"
                                                        onClick={(e) => toggleMenu(e, dateKey, mealType)}
                                                    >
                                                        ⋮
                                                    </button>
                                                    {activeMenu === menuKey && (
                                                        <div className="slot-menu" onClick={(e) => e.stopPropagation()}>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleSwapStart(day, mealType);
                                                                }}
                                                                className="menu-item"
                                                            >
                                                                Swap Slot
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    clearSlot(dateKey, mealType);
                                                                }}
                                                                className="menu-item danger"
                                                            >
                                                                Clear All
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {swapMode && isEditable && (
                                                <div
                                                    className="swap-target-overlay"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSwapComplete(day, mealType);
                                                    }}
                                                >
                                                </div>
                                            )}
                                            {dishIds.map(dishId => (
                                                <div key={dishId} className="dish-item">
                                                    <span>{getDishName(dishId)}</span>
                                                    {isEditable && !swapMode && (
                                                        <button
                                                            className="remove-dish"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeDishFromSlot(dateKey, mealType, dishId);
                                                            }}
                                                        >
                                                            ×
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>

                    <DishSelection
                        isOpen={showDishModal}
                        onClose={closeDishModal}
                        selectedSlot={selectedSlot}
                        dishes={dishes}
                        onAddDish={addDishToSlot}
                        searchTerm={modalSearchTerm}
                        setSearchTerm={setModalSearchTerm}
                    />
                </>
            )}
        </div>
    );
};

export default Calendar;