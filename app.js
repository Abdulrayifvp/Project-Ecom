const express = require('express')
const path = require('path')
const Mongoose = require('./configuration/connection') 
const session = require('express-session')
const nocache = require("nocache");
const logger = require('morgan');


Mongoose.then(()=>{
    console.log('DataBase connected to Port 27017');
}).catch((err)=>{
    console.log(err);
})

const app = express()

// app.use(logger('dev'));

app.set('views', path.join(__dirname, 'view'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(nocache());
app.use(session({secret: 'key',cookie: {maxAge:60000000}}))
app.listen(3000,()=>{
    console.log("Server started in port 3000");
})


    

const userRouter = require('./routes/user')
const adminRouter = require('./routes/admin')
app.use('/', userRouter)
app.use('/admin',adminRouter)

app.use(function(req, res, next) {
    res.status(404);
  
    // respond with html page
    if (req.accepts('html')) {
      res.render('error');
      
    }

})


module.exports = app;