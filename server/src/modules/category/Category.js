import mongoose from "mongoose";

const categorySchema =new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        },
    name_ar: {
        type: String,
        trim: true,
        },
    imgURL:{
        type:String,
        required:true,
    },
    },{
        timestamps:true
    }
    );



export default mongoose.model('Category',categorySchema)
