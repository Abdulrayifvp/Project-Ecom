const mongoose = require('mongoose')
const Collections = require('../configuration/collections')

const Schema = mongoose.Schema;

const orderSchema = new Schema({
    Date : { 
        type : Date, 
        default: Date.now 
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