import {asyncHandler} from '../utils/asyncHandler.js'
import {apiError} from "../utils/apiError.js"
import { User } from '../models/user.model.js';
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { apiResponse } from '../utils/apiResponse.js';

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

    return res.status(201).json(
        new apiResponse(200,successfullyCreatedUser,"User registered successfully")
    );
});

export default registerUser;