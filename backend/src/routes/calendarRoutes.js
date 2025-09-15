import express from 'express';
import { getMealPlan, saveMealPlan, initialiseWeeks, getDishLastOccurrence } from '../controllers/calendarController.js';

const router = express.Router();

router.get('/:weekStart', getMealPlan);
router.get('/dish-last-occurrence/:id', getDishLastOccurrence);

router.post('/', saveMealPlan);
router.post('/initialise-weeks', initialiseWeeks);

export default router;