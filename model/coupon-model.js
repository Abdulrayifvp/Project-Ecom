const mongoose = require('mongoose')
const Collections = require('../configuration/collections')

const Schema = mongoose.Schema;

const CouponSchema = new Schema({
    CODE : {
        type : String,
        required : true
    },
    cutOff: {
        type : Number,
        required : true
    },
    timeStamp :{
        type : Date,
        default : new Date()
    },
    status : {
        type : String,
        default : 'BLOCKED'
    },
    couponType:{
        type:String,
        required:true
    },
    maxRedeemAmount : {
        type : Number,
        required : true
    },
    minCartAmount : {
        type : Number,
        required : true
    },
    generateCount : {
        type : Number,
        required : true
    },
    expireDate : {
        type : Date,
        require : true
    }
    



    
}) 
module.exports = mongoose.model(Collections.CouponCollection,CouponSchema)