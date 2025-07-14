import {asyncHandler} from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js';
import {User} from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';

const registerUser = asyncHandler (async (req, res) => {
     //get user detials from frontend
     //validation - not empty
     //check for images, check for avatar
     // upload them to cloudinary, avatar
     //create user object - create entry in db
     // remove password and refresh token field from response
     //check for user creation
     //return response

     const  {fullName, email, username, password} = req.body;  //coming from form or url you will get data in req.body
    //  if(fullName === ""){
    //     throw new ApiError(400, "full name is required")
    //  }

    if(
        [ fullName, email, username, password ].some((field) => 
        field?.trim() === "" )
    ) {
        throw new ApiError(400,"All fields are required");
    }

    const existedUser = await User.findOne({
        $or : [{ username }, { email }]
    })

    if(existedUser){
        throw new ApiError(409, 'User with email or username already exists')
    }
    // console.log(req)

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    


    if(!avatarLocalPath) {
        throw new ApiError(400, 'Avatar image is required')
    }
    
   const avatar =  await uploadOnCloudinary(avatarLocalPath);
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);

   if(!avatar){
    throw new ApiError(400, 'Avatar image is required') 
   }
    // console.log(avatar)
   const user = await User.create({
    fullName,
    avatar : avatar.url,
    coverImage : coverImage?.url || "",
    email,
    password,
    username : username.toLowerCase()
   })

   
   const createdUser = await User.findById(user._id).select('-password -refreshToken')
   // console.log("nextline \n")
// console.log(createdUser)
   if (!createdUser){
    throw new ApiError(500,"Something went wrong during creating user in server")
   }

return res.status(201).json(new ApiResponse(200, createdUser, "User created successfully"))

    })


    const generateAccessRefreshToken = async (userId ) => {
        try {
            const user = await User.findById(userId);
            
            const accessToken = user.generateAccessToken()
            const refreshToken = user.generateRefreshToken()

            user.refreshToken = refreshToken
            await user.save({ validateBeforeSave: false })

            return {accessToken, refreshToken}
        } catch (error) {
            throw new ApiError(500, "Something went wrong while generating Refresh and Access token")
        }
    }


const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    //username || email
    //find user
    // check password
    //access token and refresh token generate   
    const { email,  password, username } = req.body;
  

    if(!email && !username){
        throw new ApiError(400,"Email or Username is required")
    }
     
    const user = await User.findOne({
        $or: [{username}, {email}]
    })
    
    if(!user) {
        throw new ApiError(404, "User does not exit")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials")
    }

    const {accessToken, refreshToken} = await generateAccessRefreshToken(user._id)

    const loginUser = await User.findById(user._id).select("-password -refreshToken")

    const option = {
        httpOnly : true,
        secure : true,
    }
    

    return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(new ApiResponse(200, { user: loginUser, accessToken, refreshToken}, "User logged in successfully"))
})

const logoutUser = asyncHandler(async (req, res) => {

   const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                refreshToken : undefined
            }
        }, 
            {
                new : true
            }
    )
     const option = {
        httpOnly : true,
        secure : true,
    }
    if(!user){
        throw new ApiError(500,"User enable to logout becuase of undefine")
    }
    
    res.status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(new ApiResponse(200, {}, "User Logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request")
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        
        
        const user = User.findById(decodedToken?._id)
        
        if(!user){
            throw new ApiError(401,"Invalid refresh Token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used")
        }
    
         const option = {
            httpOnly : true,
            secure : true
         }
    
         const { accessToken, newRefreshToken } = await generateAccessRefreshToken(user._id)
    
         res.status(200).cookie("accessToken",accessToken,option).cookie("refreshToken",newRefreshToken,option).json( new ApiResponse(200,{accessToken, refreshToken: newRefreshToken},"Access Token and Refresh Token Generated"))
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
    

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

   const user = await User.findById( req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})
    return res.status(200).json(new ApiResponse(200,{},"password changed"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "current user fetched successfully"))
})

const updateAccountDetials = asyncHandler(async (req, res) => {
    const {fullName, email} = req.body

    if(!fullName || !email ){
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                fullName,
                email : email
            }
        },
        {new: true}
    ).select("-password -refreshToken")

    return res.status(200)
    .json(new ApiResponse(200, user,"Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
         
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar?.url){
        throw new ApiError(400,"Error while uploading on cloudinary")
    }

    const user = await User.findById(req.user?._id,
        {
            $set : {
                avatar : avatar?.url
            }
        },
        {new : true}
    ).select("-password -refreshToken")

    return res.status(200).json(new ApiResponse(200, user, "Avatar updated successfully"))

})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
         
    if(!coverImageLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage?.url){
        throw new ApiError(400,"Error while uploading on cloudinary")
    }

    const user = await User.findById(req.user?._id,
        {
            $set : {
                coverImage : coverImage?.url
            }
        },
        {new : true}
    ).select("-password -refreshToken")

    return res.status(200).json(new ApiResponse(200, user, "Cover Image updated successfully"))

})


const getUserChannelProfile = asyncHandler(async (req, res) => {
 const {username} = req.params
    
 if(!username?.trim()){
        throw new ApiError(400, "Username is required")
    }

   const channel =  await User.aggregate([
        {
            $match : {
                username : username?.toLowerCase()
            }
        },
        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "channel",
                as : "subscribers"
            }
        },
        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "subscriber",
                as : "subscriberedTo"
            }
        },
        {
            $addFields :{
                subscriberCount : { $size: "$subscribers" },
                channelsSubscribedToCount : { $size: "$subscriberedTo" },
                isSubscribed : { $cond: {
                    if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                    then: true,
                    else: false
                } 
            }
            }
        },
        {
            $project : {
                fullName : 1,
                username : 1,
                avatar : 1,
                coverImage : 1,
                subscriberCount : 1,
                channelsSubscribedToCount : 1,
                isSubscribed : 1,
            }
        }
    ])

    if(!channel?.length){
          throw new ApiError(404, "Channel does not exist")
     }

     return res.status(200).json(new ApiResponse(200, channel[0], "Channel profile fetched successfully"))

})

 const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([   //converted _id for aggregation pipeline because mongoose dont work here 
        {
        $match : {
            _id : new mongoose.Types.ObjectId(req.user._id)
        }
        },
        {
            $lookup : {
                form: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as : "watchHistory",
                pipeline : [
                    {
                        $lookup :{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as : "owner",
                            pipeline: [
                                {
                                    // this is for owner field 
                                    $project : {
                                        fullName : 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner :{
                                $first : "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ]) 

    return res.status(200)
    ,json(
        new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully")
    )
}) 



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetials,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
};  