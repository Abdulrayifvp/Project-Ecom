const User = require('../model/user-model')
const bcrypt = require ('bcrypt')
const saltRounds = 10;


module.exports ={
    getIndex : (req,res)=>{
        res.render('user/home')
    },
    getLogin : (req,res)=>{
        res.render('user/login')
    },
    getSignup:(req,res)=>{
        res.render('user/signup')
    },
    postSignup:async (req,res)=>{
        const userName = req.body.userName
        const email = req.body.email
        const phone = req.body.phone
        const password = await bcrypt.hash(req.body.password, saltRounds)

        const user = new User({userName:userName ,email:email,phone:phone,password:password})
        user.save().then(result=>{
            console.log(user)
        })
        .catch(err=>{
            console.log(err);
        })
    
    },
    postLogin:(req,res)=>{
        
    },
    getVerifyOtp:(req,res)=>{
        res.render('user/verifyOtp')
    }
}