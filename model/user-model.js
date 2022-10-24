const mongoose = require('mongoose')
const Collections = require('../configuration/collections')

const Schema = mongoose.Schema

const userSchema = new Schema({
    userName : {
        type : String,
        required : true
    },
    email : {
        type : String,
        required : true
    },
    phone : {
        type : Number,
        required : true
    },
    password : {
        type : String,
        required : true
    },
    access : {
        type : Boolean,
        required : true
    }
}) 
module.exports = mongoose.model(Collections.UserCollection,userSchema)