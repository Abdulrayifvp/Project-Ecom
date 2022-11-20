const mongoose = require('mongoose')
const Collections = require('../configuration/collections')

const Schema = mongoose.Schema;

const BannerSchema = new Schema({
    Title : {
        type : String,
        required : true
    },
    Description : {
        type : String,
        required : true
    },
    Image :{
        type : String,
        required : true
    }
    
}) 
module.exports = mongoose.model(Collections.BannerCollection,BannerSchema)