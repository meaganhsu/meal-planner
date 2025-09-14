import mongoose from 'mongoose';

const CalendarSchema = new mongoose.Schema({
    weekStart: { type: String, required: true, unique: true },
    lunch: { type: Object, default: {} },
    dinner: { type: Object, default: {} },
    lastUpdated: { type: Date, default: Date.now }
}, {
    versionKey: false,
    collection: 'archive'
});

const Calendar = mongoose.model('Calendar', CalendarSchema);
export default Calendar;