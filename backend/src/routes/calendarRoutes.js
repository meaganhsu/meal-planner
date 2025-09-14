import express from 'express';
import { getMealPlan, saveMealPlan, initialiseWeeks } from '../controllers/calendarController.js';

const router = express.Router();

router.get('/:weekStart', getMealPlan);

router.post('/', saveMealPlan);
router.post('/initialise-weeks', initialiseWeeks);

export default router;