const mongoose = require('mongoose')
const Collections = require('../configuration/collections')

const Schema = mongoose.Schema;

const productSchema = new Schema({
    Name : {
        type : String,
        required : true
    },
    Description : {
        type : String,
        required : true
    },
    Category : {
        type : String,
        required : true
    },
    SellingPrize : {
        type : Number,
        required : true
    },
    CostPrize : {
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
    },
    Colour : {
        type :String,
        required  : false
    },
    Delete : {
        type : Boolean,
        required : true
    }
}) 
module.exports = mongoose.model(Collections.ProductCollection,productSchema)