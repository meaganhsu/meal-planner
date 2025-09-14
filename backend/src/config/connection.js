import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("mongo connection successful");
    } catch (e) {
        console.error("error connecting", e);
        process.exit(1);      // exit w failure
    }
};

export default connectDB;