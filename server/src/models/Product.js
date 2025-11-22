import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    desc: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    imgURL: {
        type: String,
        required: true,
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'categories',
        required: true,
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    isnew: {
        type: Boolean,
        default: false
    },
    productPoints: {
        type: Number,
        default: 0
    },
    pointsToPay: {
        type: Number,
        default: 0
    },
    tags: [String], // Array of strings for tags like 'spicy', 'vegan', 'Best Seller'
    // embedding field for RAG
    embedding: {
        type: [Number],
        default: []
    }
}, {
    timestamps: true
})

//MODEL ->instance                      'Product'-> name of collection in database
export default mongoose.model('Product', productSchema)

