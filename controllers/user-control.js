const UserSchema = require("../model/user-model");
const productSchema = require('../model/Product-model')
const cartSchema = require('../model/cart-model')
const WishlistSchema = require('../model/wishlist-model')
const orderSchema = require('../model/order-model')
const bcrypt = require("bcrypt");
const { findOne } = require("../model/user-model");
const saltRounds = 10;
let errMsg = null
let otpErr = null
const Razorpay = require('razorpay');
const otpGenerator = require('otp-generator')
var { validatePaymentVerification } = require('../node_modules/razorpay/dist/utils/razorpay-utils');
require('dotenv').config()
var instance = new Razorpay({ key_id: process.env.KEY_ID, key_secret: process.env.KEY_SECRET })
const accountSid = process.env.ACCOUNT_SID; 
const authToken = process.env.AUTH_TOKEN; 
const serviceId = process.env.SERVICE_ID;
const client = require('twilio')(accountSid, authToken); 

const { resolve } = require("path");

module.exports = {
 
  getIndex:async (req, res) => {
    
      productSchema.find().then((Products)=>{
        res.render("user/home",{session : req.session,Products});
      })
    
    
    
  },
  getLogin: (req, res) => {
    if(req.session.userLoggedIn){
      res.redirect('/')
    }else{
      res.render("user/login",{session : req.session,errMsg});
    }
    errMsg = null

  },
  getSignup: (req, res) => {
    if(req.session.userLoggedIn){
      res.redirect('/')
    }else{
    res.render("user/signup",{session : req.session,errMsg : errMsg})
    }   
    errMsg = null

  },
  postSignup: async (req, res) => {
    UserSchema.findOne({ email: req.body.email }).then((user) => {
      if (user) {
        errMsg = "User Exist"
        res.redirect("/signup");
        
        

      } else {
        let generatedOtp=otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false,lowerCaseAlphabets:false,digits:true });
        console.log(generatedOtp);
        req.session.generatedOtp=generatedOtp;
        req.session.userData=req.body
        let phone = req.body.phone
        console.log(phone); 
    

      client.verify.v2.services(serviceId)
                .verifications
                .create({to: "+91"+phone, channel: 'sms'})
                .then(verification => console.log(verification.status));
      res.redirect('/verifyOtp')
        
      }
    });
  },

  postLogin: (req, res) => {
    UserSchema.findOne({ email: req.body.email }).then((user) => {
      //   console.log(user);
      return new Promise(async (resolve, reject) => {
        if (user) {
          let state = await bcrypt.compare(req.body.password,user.password);
          //   console.log(state);
          if (state) {
            if(user.access){
              req.session.userLoggedIn=true;
              req.session.userData=user;
              // res.redirect("/");
              res.redirect(req.get('referer'));
              
            }else{
              res.render('user/blocked')
            }
            // res.redirect("/");
          } else {
            res.redirect("/login");
            errMsg="Incorrect Password"
            console.log("incorrect password");
          }
        } else {
          res.redirect("/login");
          errMsg="Account not found"
          console.log("Account not found");
        }
      });
    });
  },
  getVerifyOtp: (req, res) => {
    res.render("user/verifyOtp",{session : req.session,otpErr:otpErr});
    otpErr=null;
  },
  postVerifyOtp : (req,res)=>{
    let generatedOtp = req.session.generatedOtp
    let inputOtp=req.body.OTP
    let userData=req.session.userData
    let phone = req.session.userData.phone

    console.log(inputOtp);

    client.verify.v2.services(serviceId).verificationChecks
    .create({to: "+91"+phone, code: inputOtp})
    .then(verification_check =>{ 
      console.log(verification_check.status)
      
      if(verification_check.status=='approved'){
        console.log('success');
        return new Promise(async (resolve, reject) => {
            const userName = userData.userName;
            const email = userData.email;
            const phone = userData.phone;
            const password = await bcrypt.hash(userData.password, saltRounds);
            const access = true
  
            const user = new UserSchema({
              userName: userName,
              email: email,
              phone: phone,
              password: password,
              access:access
            });
            user
              .save()
              .then((result) => {
                console.log("signup Success");
                req.session.userLoggedIn=true;
                req.session.userData=result;
                res.redirect('/')
              })
              .catch((err) => {
                console.log(err);
            });
          });
      }
      else{
        console.log('fail');
        otpErr="Wrong Entry !";
        res.redirect('/verifyOtp')
        
  
      }
    
    });


    

  },
  getResetOtp : (req,res)=>{
    let phone = req.session.userData.phone
    client.verify.v2.services(serviceId)
    .verifications
    .create({to: "+91"+phone, channel: 'sms'})
    .then(verification => console.log(verification.status));
    res.redirect('/verifyOtp')
  },
  getViewProduct : async(req,res)=>{
    productSchema.findOne({_id:req.query.id}).then((Product)=>{
      console.log(req.session.userData);
      res.render("user/viewProduct",{session : req.session,Product});
    })
  },
  getLogout : (req,res)=>{
    req.session.userLoggedIn=false
    req.session.userData=null
    res.redirect('/')
  },
  getCart :async(req,res)=>{
      cartSchema.findOne({userId:req.session.userData._id}).then((result)=>{

        if(result){
          if(result.Products.length==0){
            res.render('user/cart',{session : req.session,Cart:false})
          }else{
            res.render('user/cart',{session : req.session,Cart : result.Products,Subtotal:result.Subtotal})
          }
        }else{
          res.render('user/cart',{session : req.session,Cart:false})
        }
        
      })

    
    
  },
  postAddToCart :async (req,res)=>{
    let userCart = await cartSchema.findOne({userId : req.session.userData._id})
      if(userCart){
        let ProductIndex = userCart.Products.findIndex(Product => Product.ProductId == req.query.productId);
        console.log(ProductIndex);

        if(ProductIndex > -1 ){
          
          let productItem = userCart.Products[ProductIndex];
          console.log(productItem);
          userCart.Subtotal =userCart.Subtotal-(productItem.Price*productItem.Quantity)
          productItem.Quantity = req.body.quantity;
          userCart.Products[ProductIndex] = productItem;
          userCart.Subtotal = userCart.Subtotal + (productItem.Price*productItem.Quantity)
          userCart.save();
          console.log('new product pushed');

        } else {
        userCart.Products.push({
          ProductId:req.query.productId,
          Quantity:req.body.quantity,
          Price :req.query.price,
          Images :req.query.images,
          ProductName : req.query.productName
        })
        userCart.Subtotal = userCart.Subtotal + (req.query.price*req.body.quantity)
          console.log('1st new product  added ');
          userCart.save();
        }
        

        
      }else{
        const newCart = new cartSchema({
          userId : req.session.userData._id,
          Products : {
            ProductId : req.query.productId,
            Quantity : req.body.quantity,
            Price : req.query.price,
            Images :req.query.images,
            ProductName : req.query.productName
          },
          Subtotal : req.body.quantity*req.query.price
        })
        newCart.save().then((result)=>{
          console.log("newCart : "+result);
        })
      }
    
    
  },
  getAddToCart :async (req,res)=>{
    let userCart = await cartSchema.findOne({userId : req.session.userData._id})
      if(userCart){
        let ProductIndex = userCart.Products.findIndex(Product => Product.ProductId == req.query.productId);
        console.log(ProductIndex);

        if(ProductIndex > -1 ){
          
          let productItem = userCart.Products[ProductIndex];
          console.log(productItem);
          userCart.Subtotal =userCart.Subtotal-(productItem.Price*productItem.Quantity)
          productItem.Quantity = 1;
          userCart.Products[ProductIndex] = productItem;
          userCart.Subtotal = userCart.Subtotal + (productItem.Price*productItem.Quantity)
          userCart.save();
          console.log('new product pushed');

        } else {
        userCart.Products.push({
          ProductId:req.query.productId,
          Quantity:1,
          Price :req.query.price,
          Images :req.query.images,
          ProductName : req.query.productName
        })
        userCart.Subtotal = userCart.Subtotal + (req.query.price*1)
          console.log('1st new product  added ');
          userCart.save();
        }
        

        
      }else{
        const newCart = new cartSchema({
          userId : req.session.userData._id,
          Products : {
            ProductId : req.query.productId,
            Quantity : 1,
            Price : req.query.price,
            Images :req.query.images,
            ProductName : req.query.productName
          },
          Subtotal : 1*req.query.price
        })
        newCart.save().then((result)=>{
          console.log("newCart : "+result);
        })
      }
    
  },
  getQuantityInc : async(req,res)=>{
    let userCart = await cartSchema.findOne({userId : req.session.userData._id})
    let ProductIndex = userCart.Products.findIndex(Product => Product.ProductId == req.query.ProductId);
        
        let productItem = userCart.Products[ProductIndex];
        userCart.Subtotal =userCart.Subtotal-(productItem.Price*productItem.Quantity)
        productItem.Quantity = productItem.Quantity+1;
        userCart.Products[ProductIndex] = productItem;
        userCart.Subtotal = userCart.Subtotal + (productItem.Price*productItem.Quantity)
       
        userCart.save();
      res.json({status:true})
  },
  getQuantityDec : async(req,res)=>{
    let userCart = await cartSchema.findOne({userId : req.session.userData._id})
    let ProductIndex = userCart.Products.findIndex(Product => Product.ProductId == req.query.ProductId);
        
        let productItem = userCart.Products[ProductIndex];
        userCart.Subtotal =userCart.Subtotal-(productItem.Price*productItem.Quantity)
        productItem.Quantity = productItem.Quantity-1;
        userCart.Products[ProductIndex] = productItem;
        userCart.Subtotal = userCart.Subtotal + (productItem.Price*productItem.Quantity)
        
        userCart.save();
      res.json({status:true})
  },
  getRemoveCartItem : async(req,res)=>{
    let userCart = await cartSchema.findOne({userId : req.session.userData._id})
    let ProductIndex = userCart.Products.findIndex(Product => Product.ProductId == req.query.ProductId);

    
    let productItem = userCart.Products[ProductIndex];
    console.log(productItem);
    userCart.Subtotal =userCart.Subtotal-(productItem.Price*productItem.Quantity)
    userCart.Products.splice(ProductIndex,1)
    userCart.save();
    res.redirect('/cart')
  },
  getWishlist : (req,res)=>{
    
      WishlistSchema.findOne({userId:req.session.userData._id}).then((result)=>{
        if(result.Products.length==0){
          res.render('user/wishlist',{session : req.session,Wishlist:false})
        }else{
          res.render('user/wishlist',{session : req.session,Wishlist:result.Products})
        }
      })
    
  },
  getAddToWishlist :async (req,res)=>{
      let userWishlist = await WishlistSchema.findOne({userId : req.session.userData._id})
      if(userWishlist){
        let ProductIndex = userWishlist.Products.findIndex(Product => Product.ProductId == req.query.productId);
        console.log(ProductIndex);

        if(ProductIndex == -1){
          userWishlist.Products.push({
            ProductId:req.query.productId,
            Price :req.query.price,
            Images :req.query.images,
            ProductName : req.query.productName
          })
            console.log('new product  added ');
            userWishlist.save();

        } 
        

        
      }else{
        const newWishlist = new WishlistSchema({
          userId : req.session.userData._id,
          Products : {
            ProductId : req.query.productId,
            Price : req.query.price,
            Images :req.query.images,
            ProductName : req.query.productName
          },
          
        })
        newWishlist.save().then((result)=>{
          console.log("newWishlist : "+result);
        })
      }
   
  },
  getRemoveFromWishlist : async(req,res)=>{
    let userWishlist = await WishlistSchema.findOne({userId : req.session.userData._id})
    let ProductIndex = userWishlist.Products.findIndex(Product => Product.ProductId == req.query.ProductId);

    
    let productItem = userWishlist.Products[ProductIndex];
    console.log(productItem);
    userWishlist.Products.splice(ProductIndex,1)
    userWishlist.save();
    res.redirect('/wishlist')
  },
  getCheckOut : (req,res)=>{
    cartSchema.find({userId:req.session.userData._id}).then((result)=>{
      res.render('user/checkout',{session:req.session,Cart:result})
    })
    
  },
  getPlaceOrder : (req,res)=>{
    cartSchema.findById(req.query.cartId).then((result)=>{
      let cart = result
      if(req.body.paymentMethod==='PAY ON DELIVERY'){
        const newOrder = new orderSchema({
          Date : new Date().toLocaleDateString(),
          Time : new Date().toLocaleTimeString(),
          userId : cart.userId,
          Products : cart.Products,
          Subtotal : cart.Subtotal,
          Address : req.body,
          paymentStatus : 'Payment Pending',
          orderStatus : 'Order Placed'
        })
        newOrder.save().then((result)=>{
          // console.log('result',result);
          cartSchema.findOneAndRemove({userId:result.userId}).then((result))
        })
        res.json({payOnDelivery : true})
        
          
      }else if(req.body.paymentMethod==='NET BANKING'){
        const newOrder = new orderSchema({
          Date : new Date().toLocaleDateString(),
          Time : new Date().toLocaleTimeString(),
          userId : cart.userId,
          Products : cart.Products,
          Subtotal : cart.Subtotal,
          Address : req.body,
          paymentStatus : 'Payment Pending',
          orderStatus : 'Order Pending'
        })
        newOrder.save().then((result)=>{
          let userOrderData = result;
          cartSchema.findOneAndRemove({userId:result.userId}).then((result)=>{
            instance.orders.create({
              amount: result.Subtotal*100,
              currency: "INR",
              receipt: ""+result._id,
            },(err,order)=>{
              console.log(order);
              let response = {
                netBanking : true,
                razorpayOrderData : order,
                userOrderData : userOrderData
              }
              res.json(response)
            })
          })
        })
      
        


      }
    })
    

  },
  postVerifyPayment :async (req,res)=>{
    let razorpayOrderData = req.body.razorpayOrderData
    let payment = req.body.payment
    let userOrderData = req.body.userOrderData
    
    validate = validatePaymentVerification({"order_id": razorpayOrderData.id, "payment_id":payment.razorpay_payment_id },payment.razorpay_signature,'4KaDWb8sGlgBN3J3yQQDmZrb' );
    console.log(validate);
    if(validate){
      console.log('payment sucsess')
      let order = await orderSchema.findById(userOrderData._id)
      order.orderStatus='Order Placed'
      order.paymentStatus='Payment Completed'
      order.save().then((result)=>{
        res.json({status:true})
      })
    } 
  },

  postPaymentFailed :(req,res)=>{
    console.log(req.body);
    res.json({status:true})

  },
  getMyOrders : (req,res)=>{
    orderSchema.find({Cart:req.session.userData.id}).then((result)=>{
      res.render('user/myOrders',{session:req.session,Orders:result})
    })
  },
  getOrderSummary : (req,res)=>{
    orderSchema.findById(req.query.orderId).then((result)=>{
      res.render('user/orderSummary',{session:req.session,Order:result })
    })
  }
  
}