
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { decode } from "punycode";

const generateAccessAndRefreshTokens = async(userId)=>{

    try {
            const user = await User.findById(userId)
            const accessToken = user.generateAccessToken()
            const refreshToken = user.generateRefreshToken()
            //we return Refresh token to database and give access token
            //to user
            user.refreshToken = refreshToken
            await user.save({validateBeforeSave : false});

            return {accessToken,refreshToken};


        
    } catch (error) {
        throw new ApiError(500," Something went wrong while generating tokens")
        
    }
}

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

const loginUser = asyncHandler(async(req,res)=>{
    //1. Username / email with password
    //2. Chcek empty field
    // find the user

    //3. match filled password with hashed one
    //4. Generate access and refresh tokens
    // send cookies
    //5. Save to the DB and send them back

    const {email,username,password} = req.body;
    if (!(username || email)) {
        throw new ApiError(400,"Username or email is required");
        
    }
    const user = await User.findOne({
        $or : [{username}, {email}]
    })
    if(!user){
        throw new ApiError(401,'Invalid credentials');
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(404,"Wrong Password")
    }


    const {accessToken,refreshToken} = await
     generateAccessAndRefreshTokens(user._id);

    const loggedinUser= await User.findById(user._id).select
    ("-password -refreshToken")

    const options = {
        httpOnly: true, //only server can modify
        secure : true
    }
    return res.
    status(200)
    .cookie("accessToken",accessToken,options)
    .cookie
    ("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user : loggedinUser,accessToken,
                refreshToken
            },
            "User logged in Succesfully"
        )
    )




})

const logOutUser = asyncHandler(async(req,res)=>{
    //clear cookies

    await User.findByIdAndUpdate(
    req.user._id,
    {
        $set : {
            refreshToken : undefined
        }
    },{
        new : true
    }
)
const options = {
    httpOnly: true, //only server can modify
    secure : true
}
    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User Logged out"))


})
const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401,"Unauthorised request");
        
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET)
    
        const user= await User.findById(decode?._id)
        if(!user){
            throw new ApiError(401,"Invalid Refresh token");
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401,"Refresh token is expired or used");
            
        }
        
        const options = {
            httpOnly : true,
            secure : true
        }
        const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken : newRefreshToken},
                "Access Token Refreshed Succesfully"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid Refresh Token")
        
    }

})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword} = req.body;

    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect){
        throw new ApiError(400,"Invalid Pasword");

    }
    user.password = newPassword
    await user.save({validateBeforeSave : false})

    return res
    .status(200)
    .json(
        new ApiResponse (200,{},"Password Changed Succesfully")

    )

})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200)
    .json(200,req.user,"Current user fetched Succesfully")
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName,email,username} = req.body;
    if(!(fullName || email )){
        throw new ApiError(400,"All fields are required");
    }



    const user = await User.findByIdAndUpdate
    (req.user?._id,
        {
           $set : {
            fullName: fullName||req.user.fullName ,
            email : email,
            username : username||req.user.username
           } 
        },
        {new : true}
        
        ).select("-password")

        return res.
        status(200).
        json(new ApiResponse(
            200,user ,"User Details Updated Succesfully"
        ))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path;
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(400,"Error while uploading Avatar");
    }

    const user = await User.findByIdAndUpdate
    (req.user?._id,
        {
            $set : {
                avatar : avatar.url
            }


        },
        {new : true}
        
        
        
        ).select("-password")

        return res.status(200).json(
            new ApiResponse(200,user,"Avatar updated Succesfully")
        )

})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path;

    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover image file is missing");
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading CoverImage");
    }


    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set : {
                coverImage: coverImage.url
            }
        },
        {new : true}




    ).select("-password")
    
    return res.status(200).json(
        new ApiResponse(200,user,"Cover Image updated Succesfully")
    )
})






export {registerUser
,loginUser
,logOutUser,
refreshAccessToken,
changeCurrentPassword,
getCurrentUser,
updateAccountDetails,
updateUserAvatar,
updateUserCoverImage
};