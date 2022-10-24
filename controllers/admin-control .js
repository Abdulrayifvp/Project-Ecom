const express = require('express')
const { resolve } = require('path')
const router = express.Router()
const bcrypt = require("bcrypt");
const { access } = require('fs');
const session = require('express-session');
const saltRounds = 10;
let errMsg = null
 

productSchema = require('../model/Product-model')
adminSchema = require('../model/admin-model')
userSchema = require('../model/user-model')
categorySchema = require('../model/category-model')


module.exports ={
    getLogin : (req,res)=>{
        if(req.session.adminLoggedIn){
            res.redirect('/admin/')
        }else{
            res.render('admin/login')
        }
    },
    postLogin : (req,res)=>{
        console.log(req.body.Email);
        // const admin = new adminSchema({
        //     Email : req.body.Email,
        //     Password : await bcrypt.hash(req.body.Password, saltRounds)
        // })
        // admin.save().then((result)=>{
        //     console.log(result);
        // })
        adminSchema.findOne({Email:req.body.Email}).then(async(adminData)=>{
            // console.log(adminData);
            let state =await bcrypt.compare(req.body.Password,adminData.Password)
            if(state){
                req.session.adminLoggedIn=true
                req.session.adminData=adminData
                res.redirect('/admin/')
                console.log("login success");
            }else{
                res.redirect('/admin/login')
                console.log("incorrect Password");
            }
        }).catch((err)=>{
            res.redirect('/admin/login')
            console.log("err:"+err);
            console.log("incorrect email");
        })
    },
    getDashboard : (req,res)=>{
        if(req.session.adminLoggedIn){
        res.render('admin/dashboard',{session:req.session})
        }else{
            res.redirect('/admin/login')
        }
    },
    getProductsList : (req,res)=>{
            if(req.session.adminLoggedIn){
                productSchema.find().then((Products)=>{
                    // console.log(Products);
                    if(Products[0]){
                        res.render('admin/productsList',{ProductState:true,Products,session:req.session})
                        
                    }else{
                        res.render('admin/productsList',{ProductState:false,session:req.session})
                        
                    }
                })
            }else{
                res.redirect('/admin/login')
            }
        
        
    },
    getAddProducts : (req,res)=>{
        categorySchema.find().then((Categories)=>{
            if(req.session.adminLoggedIn){
                res.render('admin/addProducts',{session:req.session,Categories})
            }else{
                res.redirect('/admin/login')
            }
        })
        
        
    },

    
    postAddProducts : (req,res)=>{
        return new Promise(async(resolve,reject)=>{
            
            
            
            let files = req.files
            if(files){
            const Images = []
            for(i=0;i<req.files.length;i++){
                Images[i]=files[i].filename
            }
            req.body.images = Images
            }
            
            
            const Name = req.body.productName
            const Description = req.body.productDescription
            const Category = req.body.category
            const SellingPrize = req.body.sellingPrize
            const CostPrize = req.body.costPrize
            const Quantity = req.body.quantity
            const Colour = req.body.colour
            const Images = req.body.images

            const product = new productSchema({
                Name : Name,
                Description : Description,
                Category : Category,
                SellingPrize : SellingPrize,
                CostPrize : CostPrize,
                Quantity : Quantity,
                Images : Images,
                Colour  : Colour

            })
            
            product.save().then((result)=>{
                    console.log(result);
                    res.redirect('/admin/products')
                
                
            }).catch((err)=>{
                console.log(err);
            })


        })
        
    },
    getEditProducts :(req,res)=> {
        if(req.session.adminLoggedIn){
            productSchema.findOne({_id:req.query.id}).then((result)=>{
                console.log(result);
                categorySchema.find().then((Categories)=>{
                    res.render('admin/editProducts',{Product : result,session:req.session,Categories})
                })
                
            }).catch((err)=>{
                console.log(err);
            })
        }else{
            res.redirect('/admin/login')
        }
            
    },
    postEditProducts : (req,res)=>{
            productSchema.updateOne({_id:req.query.id},{$set:{
             Name : req.body.productName,
             Description : req.body.productDescription,
             Category : req.body.category,
             SellingPrize : req.body.sellingPrize,
             CostPrize : req.body.costPrize,
             Quantity : req.body.quantity,
             Colour : req.body.colour
            }}).then((result)=>{
                res.redirect('/admin/products')
            }).catch((err)=>{
                console.log(err);
            })
    },
    getDeleteProduct : (req,res)=>{
        productSchema.deleteOne({_id:req.query.id})
        .then((result)=>{
            res.redirect('/admin/products')
        }).catch((err)=>{
            console.log(err);
        })
    },
    getCustomers : (req,res)=>{
        if(req.session.adminLoggedIn){
            userSchema.find().then((users)=>{
                res.render('admin/customerList',{users,session:req.session}) 
            })
        }else{
            res.redirect('/admin/login')
        }
        
        
    },
    getBlockUser : (req,res)=>{
        userSchema.updateOne({_id:req.query.id},{$set:{access:false}}).then((result)=>{
            res.redirect('/admin/customers')
        })
    },
    getUnBlockUser : (req,res)=>{
        userSchema.updateOne({_id:req.query.id},{$set:{access:true}}).then((result)=>{
            res.redirect('/admin/customers')
        })
    },
    getCategory : (req,res)=>{
        if(req.session.adminLoggedIn){
            categorySchema.find().then((result)=>{
            
                res.render('admin/categoryList',{Categories :result,session:req.session})
            })
        }else{
            res.redirect('/admin/login')
        }
        
    },
    getAddCategory : (req,res)=>{
        if(req.session.adminLoggedIn){
        res.render('admin/addCategory',{session:req.session,errMsg})
        }else{
            res.redirect('/admin/login')
        }
        errMsg=null
    },
    postAddCategory : (req,res)=>{
        categorySchema.find({Name : req.body.Name}).then((result)=>{
            console.log(result[0]);
            if(result[0]==undefined){
                console.log(req.body);
                const Image = req.files.img
                const category = new categorySchema({
                Name : req.body.Name
            })
            category.save().then((result)=>{
            console.log(result);
            Image.mv('./public/categoryImages/'+result.id+'.jpg',(err,done)=>{
                res.redirect('/admin/categoryList')
                })
            })
            }else{
                res.redirect('/admin/addCategory')
                errMsg="Category Already Exist"
            }
            
        })
        
        
    },
    getDeleteCategory : (req,res)=>{
        categorySchema.deleteOne({id:req.query.id}).then((result)=>{
            res.redirect('/admin/categoryList')
        })
    },
    getEditCategory : (req,res)=>{
        if(req.session.adminLoggedIn){
            categorySchema.findOne({id:req.query.id}).then((result)=>{
                res.render('admin/editCategory',{category : result,session:req.session})
            })
        }else{
            res.redirect('/admin/login')
        }
        
    },
    postEditCategory : (req,res)=>{
        categorySchema.updateOne({id:req.query.id},{$set:{
            Name : req.body.Name
        }}).then((result)=>{
            res.redirect('/admin/categoryList')
        })
    },
    getAdminLogout : (req,res)=>{
        req.session.adminLoggedIn=null;
        req.session.adminData=null
        res.redirect('/admin/login')
    }

}
