const UserSchema = require('../model/user-model')

module.exports=(req,res,next)=>{
    UserSchema.findById(req.session.userData._id).then((user)=>{
        if(user.access==true){
            next()
        }else{
        res.render('user/blocked')
        }
    })
    
}
