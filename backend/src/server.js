import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import connectDB from "./config/connection.js";
import dishesRoutes from "./routes/dishesRoutes.js";
import calendarRoutes from "./routes/calendarRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;
const __dirname = path.resolve();

// middleware
if (process.env.NODE_ENV !== "production") {
    app.use(cors({
        origin: "http://localhost:5050",
    }));
}
app.use(express.json());      // parsing JSON bodies (req.bodies)

app.use("/api/dishes", dishesRoutes);
app.use("/api/calendar", calendarRoutes);

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../frontend/dist")));

    app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
    })
}

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log("server running on port:", PORT);
    });
});