const mongoose = require('mongoose')
const Collections = require('../configuration/collections')

const Schema = mongoose.Schema;

const orderSchema = new Schema({
    Date : {
        type : String,
        required : true
    },
    Time : {
        type : String,
        required : true
    },
    userId : {
        type :String,
        required : true
    },
    Products : {},
    Subtotal : {
        type : Number,
        required : true
    },
    Address : {},
    paymentStatus : {
        type : String,
        required : true
    },
    orderStatus : {
        type : String,
        required : true
    }


})

module.exports = mongoose.model(Collections.OrderCollection,orderSchema)