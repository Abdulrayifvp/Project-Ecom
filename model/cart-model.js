const mongoose = require('mongoose')
const Collections = require('../configuration/collections')

const Schema = mongoose.Schema

const productSchema = new Schema({
    ProductId : {
        type : String,
        required : true
    },
    ProductName : {
        type : String,
        required : true
    },
    Price : {
        type : Number,
        required : true
    },
    Quantity : {
        type : Number,
        required : true
    },
    Images : {
        type : Array,
        required : true
    }

})

const CartSchema = new Schema({
    userId : {
        type : String,
        required : true
    },
    Products : [productSchema],
    Subtotal : {
        type : Number,
        required : true
    }
})


module.exports = mongoose.model(Collections.CartCollection,CartSchema)
