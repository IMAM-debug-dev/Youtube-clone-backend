import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/apiError.js";
import uploadImage from "../utils/ImagekitUpload.js";
import Apirespons from "../utils/Apirespons.js";
import { response } from "express";
import jwt from "jsonwebtoken"


const generativeAccessandrefreshtoken = async (userId) => {
    try {
        const user = await User.findById(userId);

        const accesstoken = user.generateAccessToken();
        const refreshtoken = user.generateRefreshToken();

        user.refreshtoken = refreshtoken;

        await user.save({ validateBeforeSave: false });

        return { accesstoken, refreshtoken };

    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating access and refresh token"
        );
    }
};



export const registerUser = asyncHandler( async (req , res ) =>{

    //get data from frontend
    //validation  - not empty
    //check if user is already exista
    //cheack image, check for avater
    //create your object - create entry in db
    // remove password refreshtoken filled from respons
    // check for user caption
    //return res 
     const { fullName, email, username, password } = req.body;
   console.log("email : " , email )
   console.log("FULLNAME:", fullName);
   

  
  if (
    [fullName, email, username, password].some((field) =>
        field?.trim() === ""
    )
) {
    throw new ApiError(400, "All fields are required");
}

const existsUser = await User.findOne({
    $or: [{username},{email}]
})

if(existsUser){
    throw new ApiError(409 , "user is already exists @")
}


const avatarLocalPath = req.files?.avatar?.[0]?.path;
const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

console.log("FILES:", req.files);
console.log("AVATAR:", avatarLocalPath);

if(!avatarLocalPath){
    throw new ApiError(400 , "avater image is required")
}



const avatar = await uploadImage(avatarLocalPath);

const coverImage = coverImageLocalPath
    ? await uploadImage(coverImageLocalPath)
    : null;
console.log("IMAGEKIT AVATAR:", avatar);

if (!avatar) {
    throw new ApiError(400, "Avatar file upload failed");
}

const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
});

const createduser = await User.findById(user._id).select(
    "-password -refreshToken"
);

if (!createduser) {
    throw new ApiError(500, "Something went wrong while registering user");
}

res.status(201).json(
    new Apirespons(201, createduser, "User created successfully")
);



})

export const userLogin = asyncHandler( async ( req , res ) => {
    //req body from data
    // username and email
    //find user
    // password check
    //access token token refresh token
    //send cookie

    const {email , username , password } = req.body
    

    if ((!username && !email) || !password) {
    throw new ApiError(400, "Username/email and password are required");
}
    const user = await User.findOne({
        $or: [{email} , {username}]
    })

    if(!user){
        throw new ApiError(404 , "User doesnot exists")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

    const { accesstoken , refreshtoken } = await generativeAccessandrefreshtoken(user._id)
    
    const loggedUser = await  User.findById(user._id).select("-password -refreshToken")

    const  optioins = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken" , accesstoken , optioins)
    .cookie("refreshToken" , refreshtoken  , optioins)
    .json(
        new Apirespons(200 ,
            {
                user: loggedUser ,accesstoken ,refreshtoken
            },
            "User login sucessfully"
        )
    )

})



export const logoutUser = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshtoken: undefined
            }
        },
        {
            new: true
        }
    );

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new Apirespons(200 , {} , "User logout sucessfully")
        );
});

export const refreshAccessToken = asyncHandler( async( req , res ) => {
   const incomingRefreshToken = req.cookies.refreshtoken || req.body.refreshtoken

   if(!incomingRefreshToken){
    throw new ApiError(401 , "user is unothorsge")
   }
   
   try {
    const decodedToken = jwt.verify(incomingRefreshToken ,
   process.env.REFRESH_TOKEN_EXPIRY

   )

   const user = await User.findById(decodedToken?._id)


   if(!user){
    throw new ApiError(401 , "Invalid refresh token")
   }

   if(incomingRefreshToken !== user?.refreshtoken ){
    throw new ApiError(401 , "refresh token is expared or used")
   }

   const  optioins = {
        httpOnly : true,
        secure : true
    }

    const { accesstoken, newrefreshtoken } = await 
    generativeAccessandrefreshtoken(user._id)

    return res
        .status(200)
        .clearCookie("accessToken", optioins)
        .clearCookie("newrefreshToken", optioins )
        .json(
            new Apirespons(200 , {accesstoken , refreshAccessToken: newrefreshtoken} , "accesstoekn is refresh")
        );
   } catch (error) {
    throw new ApiError(401 , error?.message || "invalid refresh token") 
   }



})


 export const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body

    

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new Apirespons(200, {}, "Password changed successfully"))
})



export const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new Apirespons(
        200,
        req.user,
        "User fetched successfully"
    ))
})



const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {new: true}
        
    ).select("-password")

    return res
    .status(200)
    .json(new Apirespons(200, user, "Account details updated successfully"))
});