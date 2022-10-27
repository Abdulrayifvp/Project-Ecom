const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const Mongoose = require('./configuration/connection') 
const session = require('express-session')
const nocache = require("nocache");


Mongoose.then(()=>{
    console.log('DataBase connected to Port 27017');
}).catch((err)=>{
    console.log(err);
})

const app = express()

app.set('views', path.join(__dirname, 'view'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(nocache());
app.use(session({secret: 'key',cookie: {maxAge:600000}}))
app.listen(3000,()=>{
    console.log("Server started in port 3000");
})



    

const userRouter = require('./routes/user')
const adminRouter = require('./routes/admin')
app.use('/', userRouter)
app.use('/admin',adminRouter)






module.exports = app;