
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req,res)=>{
    //1. Get user details from frontend(postman)
    //2. validation(chceking email format,username not empty)
    //3. chcek if users already exist(chcek by username or email)
    //4. check for images,chcek for avatar
    //5. Upload them on cloudinary
    //6. create user object - create entry in db
    //7. remove password and refresh token field from response
    //8. check for user creation
    //9. return response

    const {fullName,email,username,password} = req.body
   
    if (
        [fullName,email,password,username].some((field)=>{
            field?.trim()===""
        })
     ) {
        throw new ApiError(400,'Please provide full name,email,username & password')

    }
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if(existedUser){
        throw new ApiError(409,"Username or email already exists");

    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0].path;
    let coverImageLocalPath;

    if (req.files && Array.isArray(req.files.coverImage)&&
     req.files.coverImage.length >0) {
        coverImageLocalPath = req.files.coverImage[0].path;
        
    }



    if(!avatarLocalPath){
        throw new ApiError(400,"Avataar needed");

    }    

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if(!avatar){
        throw new ApiError(400,"Avatar needed");

    }
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()

    })
    const createdUser = await User.findById(user._id)
    .select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500,"Server error while registering user")

    }

    return res.status(201).json(
        new ApiResponse(200,createdUser , "User Created Succesfully")

    )


} )

export {registerUser};