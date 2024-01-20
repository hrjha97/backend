import mongoose from "mongoose";
import { User } from "./user.models";

import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema({

    videoFile : {
        type : String, //cloudinary url
        required : true
    },
    thumbnail : {
        required : true,
        type : String
    },
    title : {
        required : true,
        type : String
    },
    description : {
        required : true,
        type : String
    },
    duration: {
        type : Number,
        required : true
    },
    views : {
        type : Number,
        default : 0
    },
    isPublished  : {
        type : Boolean,
        default : true
    },
    owner : {
        type : mongoose.Types.ObjectId ,
        ref : "User"
    }






},
{timestamps : true})

videoSchema.plugin(mongooseAggregatePaginate)


export const Video = mongoose.model("Video",videoSchema);