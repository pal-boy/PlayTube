// require('dotenv').config({path:'./env'});
import dotenv from 'dotenv'
import db_connection from "./db/index.js";
import app from './app.js';

dotenv.config({
    path:'./env'
});
db_connection()
.then(()=>{
    app.listen(process.env.PORT || 3000,()=>{
        console.log(`Server is running at port ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("Databse connection failed : ",err);
});

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