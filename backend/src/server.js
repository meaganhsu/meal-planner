import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/connection.js";
import dishesRoutes from "./routes/dishesRoutes.js";
import calendarRoutes from "./routes/calendarRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

// middleware
app.use(express.json());      // parsing JSON bodies (req.bodies)
app.use(cors({
    origin: true
}));

app.use("/api/dishes", dishesRoutes);
app.use("/api/calendar", calendarRoutes);

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log("server running on port:", PORT);
    });
});