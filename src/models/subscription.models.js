 
import mongoose, { Schema, model } from "mongoose";
import { User } from "./user.models";

const subscriptionSchema = new mongoose.Schema({

    subscriber : {
        type : Schema.Types.ObjectId,
        ref : "User"
    },
    channel : {
        type : Schema.Types.ObjectId,
        ref : "User"
    }


},{timestamps : true})

export const Subscription = mongoose.model("Subscription",subscriptionSchema)