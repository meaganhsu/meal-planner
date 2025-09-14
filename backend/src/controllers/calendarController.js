import Calendar from "../models/Calendar.js";
import { format, startOfWeek, addWeeks } from 'date-fns';

// helper function for formatting dates year month day
const formatDate = (date) => {
    return format(date, 'yyyy-MM-dd');
};

// getting meal plan for a specific week
export async function getMealPlan(req, res) {
    try {
        const { weekStart } = req.params;        // getting start day of the week from URL parameters

        // finding the meal plan in database for the desired week
        const mealPlan = await Calendar.findOne({ weekStart: weekStart });

        if (!mealPlan) {      // if no meal plan found, return 404 with empty objects
            return res.status(404).json({
                message: 'no meal plan found for this week',
                lunch: {},
                dinner: {}
            });
        }

        // returning successful response with lunch and dinner data
        res.json({
            lunch: mealPlan.lunch || {},
            dinner: mealPlan.dinner || {}
        });
    } catch (e) {
        console.error('error fetching meal plan:', e);
        res.status(500).json({ message: 'internal error', error: e.message });
    }
}

// updating a meal plan
export async function saveMealPlan(req, res) {
    try {
        const { weekStart, lunch, dinner } = req.body;

        // validating required field
        if (!weekStart) {
            console.error('missing weekStart in request');
            return res.status(400).json({ message: 'weekStart is required' });
        }

        // prepping document for the database
        const mealPlanDoc = {
            weekStart: weekStart,
            lunch: lunch || {},
            dinner: dinner || {},
            lastUpdated: new Date()
        };

        // finding the existing document or creating new one if doesn't exist
        const result = await Calendar.findOneAndUpdate(
            { weekStart: weekStart }, // Search criteria
            mealPlanDoc,        // data to update with
            {
                upsert: true,        // creating if doesn't exist
                new: true,         // returning the updated document
                runValidators: true     // run schema validations
            }
        );

        res.json({
            message: 'meal plan saved successfully',
            weekStart: weekStart,
            result: result
        });
    } catch (e) {
        console.error('error saving meal plan:', e);
        res.status(500).json({ message: 'Server error', error: e.message });
    }
}

// initialising meal plans for upcoming weeks
export async function initialiseWeeks(req, res) {
    try {
        const today = new Date();
        // getting first day of current week (week starts on monday so weekStartsOn: 1)
        const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
        const initialised = [];        // tracking which weeks were initialised already

        // initialising current week and next 2 weeks (3 wks total)
        for (let i = 0; i < 3; i++) {
            const weekStart = formatDate(addWeeks(currentWeekStart, i));   // calculating week start date for each week

            // checking if week already exists in database
            const existingPlan = await Calendar.findOne({ weekStart: weekStart });

            // if doesnt exist, then create
            if (!existingPlan) {
                await Calendar.create({
                    weekStart: weekStart,
                    lunch: {},
                    dinner: {},
                    createdAt: new Date(),
                    lastUpdated: new Date()
                });
                initialised.push(weekStart);     // adding to initialised list
            }
        }

        res.json({
            message: 'finished initialising week',
            initializedWeeks: initialised
        });
    } catch (e) {
        console.error('error initialising weeks:', e);
        res.status(500).json({ message: 'internal error', error: e.message });
    }
}