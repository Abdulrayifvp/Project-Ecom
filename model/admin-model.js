const mongoose = require('mongoose')
const Collections = require('../configuration/collections')

const Schema = mongoose.Schema;

const adminSchema = new Schema({
    Email : {
        type : String,
        required : true
    },
    Password : {
        type : String,
        required : true
    }
}) 
module.exports = mongoose.model(Collections.AdminCollection,adminSchema)