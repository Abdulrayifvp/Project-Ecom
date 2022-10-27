const mongoose =  require('mongoose')
require('dotenv').config()



module.exports=mongoose.connect(process.env.MONGODB_CONNECT)

// mongoose.connection
// .once("open",()=>console.log("DataBase connected to Port 27017"))
// .on("error",error=>{
//     console.log("your error",error);
// })