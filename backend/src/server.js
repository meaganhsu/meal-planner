import express from "express";
import dishesRoute from "./src/routes/dishesRoute.js";
import calendarRoute from "./src/routes/calendarRoute.js";

const app = express();

app.use("/api/dishes", dishesRoute);
app.use("/api/calendar", calendarRoute);

app.listen(5050, () => {
    console.log("Server running on port 5050");
});