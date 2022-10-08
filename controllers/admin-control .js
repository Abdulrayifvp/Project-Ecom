
module.exports ={
    getIndex : (req,res)=>{
        res.render('admin/dashboard')
    },
    getCart : (req,res)=>{
        res.send('cart')
    }
}