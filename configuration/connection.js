const mongoose =  require('mongoose')

mongoose.connect('mongodb://localhost:27017/Ecom')

mongoose.connection
.once("open",()=>console.log("DataBase connected to Port 27017"))
.on("error",error=>{
    console.log("your error",error);
})