// require('dotenv').config({path:'./env'});
import dotenv from 'dotenv'
import db_connection from "./db/index.js";

dotenv.config({
    path:'./env'
});
db_connection();

// import express from "express";
// const app = express();

// (async()=>{
//     try {
//         const db_connect = await mongoose.connect(`${process.env.DATABASE_URL}/${DB_NAME}`);
//         app.on("error",(error)=>{
//             console.log("ERRR : ",error);
//             throw error;
//         });
//         app.listen(process.env.PORT,()=>{
//             console.log(`App is listening on the port ${process.env.PORT}`);
//         })
//     } catch (error) {
//         console.log("ERROR: ",error);
//         throw error;
//     }
// })();