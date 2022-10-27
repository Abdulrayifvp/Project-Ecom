const express = require('express')
const { resolve } = require('path')
const router = express.Router()
const bcrypt = require("bcrypt");
const { access } = require('fs');
const session = require('express-session');
const saltRounds = 10;
let errMsg = null

 

const productSchema = require('../model/Product-model')
const adminSchema = require('../model/admin-model')
const userSchema = require('../model/user-model')
const categorySchema = require('../model/category-model')
const orderSchema = require('../model/order-model')


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
        
        res.render('admin/dashboard',{session:req.session})
        
    },
    getProductsList : (req,res)=>{
            
                productSchema.find({Delete:false}).then((Products)=>{
                    // console.log(Products);
                    if(Products[0]){
                        res.render('admin/productsList',{ProductState:true,Products,session:req.session})
                        
                    }else{
                        res.render('admin/productsList',{ProductState:false,session:req.session})
                        
                    }
                })
            
        
        
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
            const Delete = false

            const product = new productSchema({
                Name : Name,
                Description : Description,
                Category : Category,
                SellingPrize : SellingPrize,
                CostPrize : CostPrize,
                Quantity : Quantity,
                Images : Images,
                Colour  : Colour,
                Delete :  Delete

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
        
            productSchema.findOne({_id:req.query.id}).then((result)=>{
                
                categorySchema.find().then((Categories)=>{
                    res.render('admin/editProducts',{Product : result,session:req.session,Categories})
                })
                
            }).catch((err)=>{
                console.log(err);
            })
        
            
    },
    postEditProducts : async (req,res)=>{

            
            let files = req.files
            console.log(files);
            if(files.length!=0){
                const Images = []
            for(i=0;i<req.files.length;i++){
                Images[i]=files[i].filename
            }
            console.log('1');
            let Product = await productSchema.findOne({_id:req.query.id})
             Product.Name = req.body.productName,
             Product.Description = req.body.productDescription,
             Product.Category = req.body.category,
             Product.SellingPrize = req.body.sellingPrize,
             Product.CostPrize = req.body.costPrize,
             Product.Quantity = req.body.quantity,
             Product.Colour = req.body.colour

            req.body.images = Images
            Product.Images = req.body.images

            Product.save().then((result)=>{
                res.redirect('/admin/products')
                console.log(result);
            }).catch((err)=>{
                console.log(err);
            })

            }else{
                console.log('2');
                let Product = await productSchema.findOne({_id:req.query.id})
                Product.Name = req.body.productName,
                Product.Description = req.body.productDescription,
                Product.Category = req.body.category,
                Product.SellingPrize = req.body.sellingPrize,
                Product.CostPrize = req.body.costPrize,
                Product.Quantity = req.body.quantity,
                Product.Colour = req.body.colour
   
                Product.save().then((result)=>{
                    res.redirect('/admin/products')
                    console.log(result);
                }).catch((err)=>{
                    console.log(err);
                })
            }
            
            
    },
    getDeleteProduct :async (req,res)=>{
        let Product=await productSchema.findOne({_id:req.query.id})
        Product.Delete=true
        Product.save()
        .then((result)=>{
            res.redirect('/admin/products')
        }).catch((err)=>{
            console.log(err);
        })
        res.json({state:true})
    },
    getCustomers : (req,res)=>{
            userSchema.find().then((users)=>{
                res.render('admin/customerList',{users,session:req.session}) 
            })
        
        
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
        
            categorySchema.find().then((result)=>{
            
                res.render('admin/categoryList',{Categories :result,session:req.session})
            })
        
    },
    getAddCategory : (req,res)=>{
       
        res.render('admin/addCategory',{session:req.session,errMsg})
       
        errMsg=null
    },
    postAddCategory : (req,res)=>{
        categorySchema.find({Name : req.body.Name}).then((result)=>{
            if(result[0]==undefined){
                const Image = req.file.filename
                const category = new categorySchema({
                Name : req.body.Name,
                Image : Image
            })
            category.save().then((result)=>{
            res.redirect('/admin/addCategory')
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
        
            categorySchema.findOne({id:req.query.id}).then((result)=>{
                res.render('admin/editCategory',{category : result,session:req.session})
            })
       
        
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
    },
    getOrders : (req,res)=>{
        
        orderSchema.find().then((orders)=>{
            res.render('admin/orderList',{
                session:req.session,
                Orders:orders
            })
        })
    },
    getOrderSummary : (req,res)=>{
        orderSchema.findById(req.query.id).then((result)=>{
            // console.log(result);
            res.render('admin/orderSummary',{
                session:req.session,
                Order:result
            })
        })
    },
    getChangeOrderStatus : (req,res)=>{
        orderSchema.findByIdAndUpdate(req.query.id,{orderStatus:req.body.value}).then((result)=>{
        })
    res.json({status:true})
    }
}
