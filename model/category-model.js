const mongoose = require('mongoose')
const Collections = require('../configuration/collections')

const Schema = mongoose.Schema;

const categorySchema = new Schema({
    Name : {
        type : String,
        required : true
    },
    Image :{
        type : String,
        required : true
    }
    
}) 
module.exports = mongoose.model(Collections.CategoryCollection,categorySchema)