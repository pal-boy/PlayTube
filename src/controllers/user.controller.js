import {asyncHandler} from '../utils/asyncHandler.js'
import {apiError} from "../utils/apiError.js"
import { User } from '../models/user.model.js';
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { apiResponse } from '../utils/apiResponse.js';
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async(userId)=>{
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave:false});
        return {
            accessToken,
            refreshToken
        }
    } catch (error) {
        throw new apiError(500,"Something went wrong while generating accesss and refresh token");
    }
}

// Register a user code starts here

const registerUser = asyncHandler(async function(req,res){
    // get user details from frontend
    // validation - not empty , correct format of data
    // check if user already exists
    // check for images , check for avatar
    // upload them to cloudinary,avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const {fullname , username , email , password} = req.body;
    // console.log(email , password);

    if ([fullname,username,email,password].some((field)=> field?.trim() === "")) {
        throw new apiError(400 , "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{username},{email}]
    });
    if (existedUser) {
        throw new apiError(409 , "User with this email and username already exists.");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if (!avatarLocalPath) {
        throw new apiError(400,"Avatar image is required");
    }

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatar) {
        throw new apiError(400,"Avatar image is required");
    }

    const user = await User.create({
        fullname,
        avatar : avatar.url,
        coverImage: coverImage?.url || "",
        username: username.toLowerCase(),
        email,
        password
    });
    const successfullyCreatedUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );
    if (!successfullyCreatedUser) {
        throw new apiError(500 , "something went wrong while registering user");
    }

    return res.status(200).json(
        new apiResponse(200,successfullyCreatedUser,"User registered successfully")
    );
});

// Register a user code ends here

// Login a user code starts here
const loginUser = asyncHandler(async function (req,res) {
    // TODOs : get data from req.body
    // get user details like email & password or username & password
    // check validation - not empty fields or incorrect format of fields
    // correct email and password match with database entities
    // generate access and refresh token
    // send cookie
    const {email, password, username} = req.body;
    if (!(email || username)) {
        throw new apiError(400,"username or email is required");
    }
    const user = await User.findOne({
        $or:[{username},{email}]
    });

    if (!user) {
        throw new apiError(404,"User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new apiError(401,"Invalid User credentials");
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id);
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const options = {
        httponly : true,
        secure : true
    };

    return res.status(200)
            .cookie("accessToken",accessToken,options)
            .cookie("refreshToken",refreshToken,options)
            .json(
                new apiResponse(
                    200,{
                        user : loggedInUser,accessToken,refreshToken
                    },
                    "User logged in successfully"
                )
            )
});

// Login a user code ends here

// Logout a user code starts here
const logoutUser = asyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken : undefined
            }
        }
    )

    const options = {
        httponly : true,
        secure : true
    };

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new apiResponse(200,{},"User logged out successfully"))
})
// Logout a user code ends here

// RefreshAccessToken code starts here
const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshAccessToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshAccessToken) {
        throw new apiError(401,"Unauthorized request");
    }

    const decodedToken = jwt.verify(incomingRefreshAccessToken,process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id);
    if (!user) {
        throw new apiError(401,"Invalid refresh token");
    }

    if (incomingRefreshAccessToken !== user?.refreshToken) {
        throw new apiError(401,"Refresh token is expired or used");
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id);
    const options = {
        httponly : true,
        secure : true
    };

    return res.status(200)
            .cookie("accessToken",accessToken,options)
            .cookie("refreshToken",refreshToken,options)
            .json(
                new apiResponse(
                    200,{
                        accessToken,refreshToken
                    },
                    "Access token refreshed successfully"
                )
            )
})
// RefreshAccessToken code ends here

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
};