const mongoose = require('mongoose')

const Schema = mongoose.Schema;

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
    }
}) 
module.exports = mongoose.model('User',userSchema)