import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const db_connection = async ()=>{
    try {
        const connnection_instance = await mongoose.connect(`${process.env.DATABASE_URL}/${DB_NAME}`);
        console.log(`Database connected!! DB Host: ${connnection_instance.connection.host}`);
    } catch (error) {
        console.log("Database connection error : ",error);
        process.exit(1);
    }
}

export default db_connection;