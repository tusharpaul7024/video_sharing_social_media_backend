import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const videoSchema = new Schema(
    {
        videoFile : {
            type : String, //cloudinary url
            required : true
        },
        thumbnail : {
            type : String,
            required : true
        },
        title : {
            type : String,
            required : true
        },
        description : {
            type : String,
            requried : true
        },
        duration : {
            type : Number, //cloudinary will give us
            requried : true
        },
        views : {
            type : Number,
            default : 0
        },
        isPublished : {
            type : Boolean,
            default : true
        },
        owner : {
            type : Schema.Types.ObjectId,
            ref : "User"
        }
    },
    {timestamps: true}
)

videoSchame.pulgin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema);