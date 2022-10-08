const express = require('express')
const path = require('path')
const ejs = require('ejs');
const bodyParser = require('body-parser')
const Mongoose = require('./configuration/connection')




const app = express()

app.set('views', path.join(__dirname, 'view'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(3000,()=>{
    console.log("Server started in port 3000");
})


const userRouter = require('./routes/user')
const adminRouter = require('./routes/admin')
app.use('/', userRouter)
app.use('/admin',adminRouter)





module.exports = app;