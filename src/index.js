
import express from "express";
import connectDB from "./db/index.js";
import dotenv from "dotenv";

dotenv.config({
    path : './env'
})
connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.log("error",error);
        throw error;
    })

    app.listen("process.env.PORT||8000",()=>{
        console.log(`App connected on ${process.env.PORT}`)
    })
})
.catch((error)=>{
    console.log("MongoDb failed ",error);
})
 




























// using iffi function

// (async ()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}
//         /${DB_NAME}`);
//         app.on("error",(error)=>{
//             console.log("Error",error);
           
            
//         })

//         app.listen(process.env.PORT,()=>{
//             console.log(`App is listening on ${process.env.PORT}`)
//         })
        
//     } catch (error) {
//         console.log("Error : ",error);
        
        
        
//     }


// })()