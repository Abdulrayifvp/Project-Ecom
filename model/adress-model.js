const mongoose = require('mongoose');
const Collections = require('../configuration/collections')
const user = require('../model/user-model')

const Schema = mongoose.Schema;

const addressSchema = new Schema({
    userId : {
         type: Schema.Types.ObjectId,
         ref: mongoose.model(Collections.UserCollection,user.userSchema),
         required : true
    },

    firstName : {
        type : String,
        required : true
    },
    secondName : {
        type : String,
        required :true
    },
    number : {
        type : String,
        required : true
    },
    email : {
        type : String,
        required : true
    },
    houseName : {
        type : String,
        required : true
    },
    address : {
        type : String,
        required : true
    },
    city : {
        type : String,
        required : true
    },
    district : {
        type : String,
        required : true
    },
    state : {
        type : String,
        required : true
    },
    country : {
        type : String,
        required : true
    },
    pincode : {
        type : String,
        required : true
    },

}) 
module.exports = mongoose.model(Collections.AddressCollection,addressSchema)