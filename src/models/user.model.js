import mongoose , { Schema }from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new  Schema(
    {
        username : {
            type : String,
            required : true,
            unique : true,
            trim : true, 
            index : true
        },
        email : {
            type : String,
            required : true,
            unique : true,
            trim : true
        },
        fullName : {
            type : String, 
            required : true,
            tirm : true,
        },
        avatar : {
            type : String // url from cloudinary
        },
        coverImage : {
            type : String // url form cloudinary
        },
        watchHistory : [
            {
                type : Schema.Types.ObjectId,
                ref : "Video"
            }
        ],
        password : {
            type : String,
            required : [true, 'Password is required']
        },
        refreshToken : {
            type : String
        }
    },
{timestamps : true});

//never use arrow funciton as cb because this reference we cant get.
userSchema.pre("save", async function(next) {
    if(!this.isModified("password")) return next();

    this.password = bcrypt.hash(this.password, 10)
    next()
})


//custom method
userSchema.method.isPasswordCorrect = async function (password){
   return  await bcrypt.compare(password, this.password)
}

userSchema.method.generateAccessToken = function () {
    jwt.sign(
        {
            _id : this._id,
            email : this.email,
            username : this.username,
            fullName : this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.method.generateRefreshToken = function () {}

export const User = mongoose.model("User", userSchema);