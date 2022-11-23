//schemas
const UserSchema = require("../model/user-model");
const productSchema = require("../model/Product-model");
const cartSchema = require("../model/cart-model");
const WishlistSchema = require("../model/wishlist-model");
const orderSchema = require("../model/order-model");
const categorySchema = require("../model/category-model");
const addressSchema = require("../model/adress-model");
const BannerSchema = require("../model/banner-model");
const couponSchema = require("../model/coupon-model");

//razorpay
const Razorpay = require("razorpay");
var {
  validatePaymentVerification,
} = require("../node_modules/razorpay/dist/utils/razorpay-utils");
var instance = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
});

//bcrypt module
const bcrypt = require("bcrypt");
const saltRounds = 10;

//err msg variables
let errMsg = null;
let otpErr = null;

//twillio
const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const serviceId = process.env.SERVICE_ID;
const client = require("twilio")(accountSid, authToken);

require("dotenv").config();

const { resolve } = require("path");
const { Console } = require("console");
const { response } = require("express");

module.exports = {
  //get landing page
  getIndex: async (req, res) => {
    try {
      let Products = await productSchema.find({ Delete: false });
      let Banners = await BannerSchema.find();
      res.render("user/home", { session: req.session, Products, Banners });
    } catch (err) {
      console.log(err);
    }
  },

  //get login page
  getLogin: (req, res) => {
    try {
      if (req.session.userLoggedIn) {
        res.redirect("/");
      } else {
        res.render("user/login", { session: req.session, errMsg });
      }
      errMsg = null;
    } catch (err) {
      console.log(err);
    }
  },

  //get signup page
  getSignup: (req, res) => {
    try {
      if (req.session.userLoggedIn) {
        res.redirect("/");
      } else {
        res.render("user/signup", { session: req.session, errMsg: errMsg });
      }
      errMsg = null;
    } catch (err) {
      console.log(err);
    }
  },

  //user signup submittion
  postSignup: async (req, res) => {
    try {
      UserSchema.findOne({ email: req.body.email }).then((user) => {
        if (user) {
          errMsg = "User Exist";
          res.redirect("/signup");
        } else {
          req.session.userData = req.body;
          let phone = req.body.phone;

          client.verify.v2
            .services(serviceId)
            .verifications.create({ to: "+91" + phone, channel: "sms" })
            .then((verification) => console.log(verification.status));
          res.redirect("/verifyOtp");
        }
      });
    } catch (err) {
      console.log(err);
    }
  },

  //user login submittion
  postLogin: (req, res) => {
    try {
      UserSchema.findOne({ email: req.body.email }).then((user) => {
        return new Promise(async (resolve, reject) => {
          if (user) {
            let state = await bcrypt.compare(req.body.password, user.password);

            if (state) {
              if (user.access) {
                req.session.userLoggedIn = true;
                req.session.userData = user;

                res.redirect(req.get("referer"));
              } else {
                res.render("user/blocked");
              }
            } else {
              res.redirect("/login");
              errMsg = "Incorrect Password";
            }
          } else {
            res.redirect("/login");
            errMsg = "Account not found";
          }
        });
      });
    } catch (err) {
      console.log(err);
    }
  },
  //get otp verification page
  getVerifyOtp: (req, res) => {
    try {
      res.render("user/verifyOtp", { session: req.session, otpErr: otpErr });
      otpErr = null;
    } catch (err) {
      console.log(err);
    }
  },

  //submit otp
  postVerifyOtp: (req, res) => {
    try {
      let inputOtp = req.body.OTP;
      let userData = req.session.userData;
      let phone = req.session.userData.phone;

      client.verify.v2
        .services(serviceId)
        .verificationChecks.create({ to: "+91" + phone, code: inputOtp })
        .then((verification_check) => {
          if (verification_check.status == "approved") {
            return new Promise(async (resolve, reject) => {
              const userName = userData.userName;
              const email = userData.email;
              const phone = userData.phone;
              const password = await bcrypt.hash(userData.password, saltRounds);
              const access = true;

              const user = new UserSchema({
                userName: userName,
                email: email,
                phone: phone,
                password: password,
                access: access,
              });
              user
                .save()
                .then((result) => {
                  console.log("signup Success");
                  req.session.userLoggedIn = true;
                  req.session.userData = result;
                  res.redirect("/");
                })
                .catch((err) => {
                  console.log(err);
                });
            });
          } else {
            otpErr = "Wrong Entry !";
            res.redirect("/verifyOtp");
          }
        });
    } catch (err) {
      console.log(err);
    }
  },

  //get reset otp request
  getResetOtp: (req, res) => {
    try {
      let phone = req.session.userData.phone;
      client.verify.v2
        .services(serviceId)
        .verifications.create({ to: "+91" + phone, channel: "sms" })
        .then((verification) => console.log(verification.status));
      res.redirect("/verifyOtp");
    } catch (err) {
      console.log(err);
    }
  },

  //get view product page
  getViewProduct: async (req, res,next) => {
    try {
      productSchema.findOne({ _id: req.query.id }).then((Product) => {
        
        if (Product) {
          let Description = Product.Description.replace(/'\n'/g,'<br>')
          
          let ProductDetails = {
          _id: Product._id,
          Name: Product.Name,
          Description: Description,
          Category: Product.Category,
          SellingPrize: Product.SellingPrize,
          CostPrize: Product.CostPrize,
          Quantity: Product.Quantity,
          Images: Product.Images,
          Colour: Product.Colour,
          Delete: Product.Delete,
        };
          
          res.render("user/viewProduct", { session: req.session,Product: ProductDetails });
        } else {
          res.render("error");
        }
      });
    } catch (err) {
      console.log(err);
      next(err)
    }
  },

  //get logout request
  getLogout: (req, res) => {
    try {
      req.session.userLoggedIn = false;
      req.session.userData = null;
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  },

  //
  getCart: async (req, res) => {
    try {
      cartSchema
        .findOne({ userId: req.session.userData._id })
        .then((result) => {
          if (result) {
            if (result.Products.length == 0) {
              res.render("user/cart", { session: req.session, Cart: false });
            } else {
              res.render("user/cart", {
                session: req.session,
                Cart: result.Products,
                Subtotal: result.Subtotal,
              });
            }
          } else {
            res.render("user/cart", { session: req.session, Cart: false });
          }
        });
    } catch (err) {
      console.log(err);
    }
  },

  // add product to cart 
  getAddToCart: async (req, res) => {
    try {
      let userCart = await cartSchema.findOne({
        userId: req.session.userData._id,
      });
      if (userCart) {
        let ProductIndex = userCart.Products.findIndex(
          (Product) => Product.ProductId == req.query.productId
        );

        if (ProductIndex > -1) {
          res.json({status:false})
        } else {
          userCart.Products.push({
            ProductId: req.query.productId,
            Quantity: req.query.quantity,
            Price: req.query.price,
            Images: req.query.images,
            ProductName: req.query.productName,
          });
          userCart.Subtotal = userCart.Subtotal + req.query.price * req.query.quantity;
          userCart.save();
          res.json({status:true})
        }
      } else {
        const newCart = new cartSchema({
          userId: req.session.userData._id,
          Products: {
            ProductId: req.query.productId,
            Quantity: req.query.quantity,
            Price: req.query.price,
            Images: req.query.images,
            ProductName: req.query.productName,
          },
          Subtotal: req.query.quantity * req.query.price,
        });
        newCart.save()
        res.json({status:true})

      }
    } catch (err) {
      console.log(err);
    }
  },

  // product quantity increment
  getQuantityInc: async (req, res) => {
    try {
      let userCart = await cartSchema.findOne({
        userId: req.session.userData._id,
      });
      let ProductIndex = userCart.Products.findIndex(
        (Product) => Product.ProductId == req.query.ProductId
      );

      let productItem = userCart.Products[ProductIndex];
      userCart.Subtotal =
        userCart.Subtotal - productItem.Price * productItem.Quantity;
      productItem.Quantity = productItem.Quantity + 1;
      userCart.Products[ProductIndex] = productItem;
      userCart.Subtotal =
        userCart.Subtotal + productItem.Price * productItem.Quantity;

      userCart.save();
      res.json({ status: true });
    } catch (err) {
      console.log(err);
    }
  },

  // product quantity decrement
  getQuantityDec: async (req, res) => {
    try {
      let userCart = await cartSchema.findOne({
        userId: req.session.userData._id,
      });
      let ProductIndex = userCart.Products.findIndex(
        (Product) => Product.ProductId == req.query.ProductId
      );

      let productItem = userCart.Products[ProductIndex];
      userCart.Subtotal =
        userCart.Subtotal - productItem.Price * productItem.Quantity;
      productItem.Quantity = productItem.Quantity - 1;
      userCart.Products[ProductIndex] = productItem;
      userCart.Subtotal =
        userCart.Subtotal + productItem.Price * productItem.Quantity;

      userCart.save();
      res.json({ status: true });
    } catch (err) {
      console.log(err);
    }
  },

  // remove item from cart
  getRemoveCartItem: async (req, res) => {
    try {
      let userCart = await cartSchema.findOne({
        userId: req.session.userData._id,
      });
      let ProductIndex = userCart.Products.findIndex(
        (Product) => Product.ProductId == req.query.ProductId
      );

      let productItem = userCart.Products[ProductIndex];
      userCart.Subtotal =
        userCart.Subtotal - productItem.Price * productItem.Quantity;
      userCart.Products.splice(ProductIndex, 1);
      userCart.save();
      res.redirect("/cart");
    } catch (err) {
      console.log(err);
    }
  },

  //get wishlist page
  getWishlist: (req, res) => {
    try {
      WishlistSchema.findOne({ userId: req.session.userData._id }).then(
        (result) => {
          if (result.Products.length == 0) {
            res.render("user/wishlist", {
              session: req.session,
              Wishlist: false,
            });
          } else {
            res.render("user/wishlist", {
              session: req.session,
              Wishlist: result.Products,
            });
          }
        }
      );
    } catch (err) {
      console.log(err);
    }
  },

  // request for add to wishlist
  getAddToWishlist: async (req, res) => {
    try {
      let userWishlist = await WishlistSchema.findOne({
        userId: req.session.userData._id,
      });
      if (userWishlist) {
        let ProductIndex = userWishlist.Products.findIndex(
          (Product) => Product.ProductId == req.query.productId
        );

        if (ProductIndex == -1) {
          userWishlist.Products.push({
            ProductId: req.query.productId,
            Price: req.query.price,
            Images: req.query.images,
            ProductName: req.query.productName,
          });
          userWishlist.save();
          res.json({status:true})
        }else{
          res.json({status:false})
        }
      } else {
        const newWishlist = new WishlistSchema({
          userId: req.session.userData._id,
          Products: {
            ProductId: req.query.productId,
            Price: req.query.price,
            Images: req.query.images,
            ProductName: req.query.productName,
          },
        });
        newWishlist.save().then((result) => {})
        res.json({status : true})
      }
    } catch (err) {
      console.log(err);
    }
  },

  //request for remove from wishlist
  getRemoveFromWishlist: async (req, res) => {
    try {
      let userWishlist = await WishlistSchema.findOne({
        userId: req.session.userData._id,
      });
      let ProductIndex = userWishlist.Products.findIndex(
        (Product) => Product.ProductId == req.query.ProductId
      );

      let productItem = userWishlist.Products[ProductIndex];
      userWishlist.Products.splice(ProductIndex, 1);
      userWishlist.save();
      res.redirect("/wishlist");
    } catch (err) {
      console.log(err);
    }
  },

  //get checkout page
  getCheckOut: async (req, res) => {
    try {
      let cart = await cartSchema.find({ userId: req.session.userData._id });
      let addresses = await addressSchema.find({
        userId: req.session.userData._id,
      });
      res.render("user/checkout", {
        session: req.session,
        Cart: cart,
        addresses,
      });
    } catch (err) {
      console.log(err);
    }
  },

  // check stock while checkout
  checkStock: async (req, res) => {
    try {
      let cart = await cartSchema.find({ userId: req.session.userData._id });
      let result = { results: [] };
      let productStatus = [];
      for (i = 0; i < cart[0].Products.length; i++) {
        let product = await productSchema.findById(
          cart[0].Products[i].ProductId
        );

        if (product.Quantity == 0) {
          productStatus.push("out of stock");
          let output = product.Name + " is out of stock";
          result.results.push(output);
        } else if (product.Quantity < cart[0].Products[i].Quantity) {
          let output =
            "Only " + product.Quantity + " stocks left of " + product.Name;
          result.results.push(output);
          productStatus.push(product.Quantity + " stock left");
        } else {
          productStatus.push("instock");
        }
      }
      const isInstockAll = (productStatus) => productStatus == "instock";
      if (productStatus.every(isInstockAll)) {
        res.json({ state: true });
      } else {
        res.json({ result });
      }
    } catch (err) {
      console.log(err);
    }
  },

  //request for placeorder
  getPlaceOrder: async (req, res) => {
    try {
      let subtotal = req.query.subtotal;
      let address = await addressSchema.findById(req.body.Address);
      cartSchema.findById(req.query.cartId).then(async (result) => {
        let cart = result;

        if (req.body.paymentMethod === "PAY ON DELIVERY") {
          const newOrder = new orderSchema({
            userId: cart.userId,
            Products: cart.Products,
            Subtotal: subtotal,
            Address: address,
            PaymentMethod:'PAY ON DELIVERY',
            paymentStatus: "Payment Pending",
            orderStatus: "Order Placed",
          });
          newOrder.save().then(async (result) => {
            for (i = 0; i < cart.Products.length; i++) {
              let product = await productSchema.findById(
                cart.Products[i].ProductId
              );
              product.Quantity = product.Quantity - cart.Products[i].Quantity;
              product.save().then((result) => {});
            }
            cartSchema.findOneAndRemove({ userId: result.userId }).then(result);
          });
          res.json({ payOnDelivery: true });
        } else if (req.body.paymentMethod === "NET BANKING") {
          const newOrder = new orderSchema({
            userId: cart.userId,
            Products: cart.Products,
            Subtotal: subtotal,
            Address: address,
            PaymentMethod:'NET BANKING',
            paymentStatus: "Payment Pending",
            orderStatus: "Order Pending",
          });
          newOrder.save().then((result) => {
            let userOrderData = result;
            cartSchema
              .findOneAndRemove({ userId: result.userId })
              .then((result) => {
                instance.orders.create(
                  {
                    amount: subtotal * 100,
                    currency: "INR",
                    receipt: "" + result._id,
                  },
                  (err, order) => {
                    let response = {
                      netBanking: true,
                      razorpayOrderData: order,
                      userOrderData: userOrderData,
                    };
                    res.json(response);
                  }
                );
              });
          });
        }
      });
    } catch (err) {
      console.log(err);
    }
  },

  //verify payment
  postVerifyPayment: async (req, res) => {
    try {
      let razorpayOrderData = req.body.razorpayOrderData;
      let payment = req.body.payment;
      let userOrderData = req.body.userOrderData;

      validate = validatePaymentVerification(
        {
          order_id: razorpayOrderData.id,
          payment_id: payment.razorpay_payment_id,
        },
        payment.razorpay_signature,
        "4KaDWb8sGlgBN3J3yQQDmZrb"
      );

      if (validate) {
        let order = await orderSchema.findById(userOrderData._id);
        order.orderStatus = "Order Placed";
        order.paymentStatus = "Payment Completed";
        order.save().then((result) => {
          res.json({ status: true });
        });
      }
    } catch (err) {
      console.log(err);
    }
  },

  //response for payment failed
  postPaymentFailed: (req, res) => {
    try {
      res.json({ status: true });
    } catch (err) {
      console.log(err);
    }
  },

  // request for get my orders page
  getMyOrders: (req, res) => {
    try {
      orderSchema
        .find({userId: req.session.userData._id })
        .sort({ Date: -1 })
        .then((result) => {
          res.render("user/myOrders", { session: req.session, Orders: result });
        });
    } catch (err) {
      console.log(err);
    }
  },

  //request for get order summary page
  getOrderSummary: (req, res) => {
    try {
      orderSchema.findById(req.query.orderId).then((result) => {
        res.render("user/orderSummary", {
          session: req.session,
          Order: result,
        });
      });
    } catch (err) {
      console.log(err);
    }
  },

  //request for get shop page
  getShop: (req, res) => {
    try {
      productSchema.find({ Delete: false }).then((result) => {
        categorySchema.find().then((categories) => {
          res.render("user/shop", {
            session: req.session,
            Products: result,
            Categories: categories,
          });
        });
      });
    } catch (err) {
      console.log(err);
    }
  },

  //request for category filter
  getCategoryFilter: (req, res) => {
    try {
      let tags = req.query.tags;
      let filterKey = tags.split(",");
      console.log(filterKey);
      productSchema
        .aggregate([
          {
            $match: {
              Delete: false,
              Category: { $in: filterKey },
            },
          },
        ])
        .then((result) => {
          let response = {
            Products: result,
          };
          res.json(response);
        });
    } catch (err) {
      console.log(err);
    }
  },

  // request for get all products in category filter
  getAllCategory: (req, res) => {
    try {
      productSchema.find({ Delete: false }).then((result) => {
        res.json(result);
      });
    } catch (err) {
      console.log(err);
    }
  },

  //get profile page
  getProfile: (req, res) => {
    try {
      addressSchema
        .find({ userId: req.session.userData._id })
        .then((result) => {
          res.render("user/profile", {
            session: req.session,
            addresses: result,
          });
        });
    } catch (err) {
      console.log(err);
    }
  },

  //get add address page
  getAddAddress: (req, res) => {
    try {
      res.render("user/addAddress", { session: req.session });
    } catch (err) {
      console.log(err);
    }
  },

  // request for save new address
  postSaveAddress: async (req, res) => {
    try {
      const address = new addressSchema({
        userId: req.session.userData._id,
        firstName: req.body.firstName,
        secondName: req.body.lastName,
        number: req.body.number,
        email: req.body.email,
        houseName: req.body.houseName,
        address: req.body.address,
        city: req.body.city,
        district: req.body.district,
        state: req.body.state,
        country: req.body.country,
        pincode: req.body.pincode,
      });
      address.save().then((result) => {});
      res.redirect("/profile");
    } catch (err) {
      console.log(err);
    }
  },

  // request for delete an existing address
  getDeleteAddress: (req, res) => {
    try {
      addressSchema.deleteOne({ _id: req.query.id }).then((result) => {
        res.redirect("/profile");
      });
    } catch (err) {
      console.log(err);
    }
  },

  //request for edit an existing address
  getEditAddress: (req, res) => {
    try {
      addressSchema.find({ _id: req.query.id }).then((result) => {
        res.render("user/editAddress", { session: req.session, Data: result });
      });
    } catch (err) {
      console.log(err);
    }
  },

  // request for sumbit edited address
  postEditAddress: async (req, res) => {
    try {
      let address = await addressSchema.findOne({ _id: req.query.id });

      address.firstName = req.body.firstName;
      address.secondName = req.body.lastName;
      address.number = req.body.number;
      address.email = req.body.number;
      address.houseName = req.body.houseName;
      address.address = req.body.address;
      address.city = req.body.city;
      address.district = req.body.district;
      address.state = req.body.state;
      address.country = req.body.country;
      address.pincode = req.body.pincode;

      address.save();
      res.redirect("/profile");
    } catch (err) {
      console.log(err);
    }
  },

  // request for verify coupon
  verifyCoupon: (req, res) => {
    try {
      let couponCode = req.body.CouponCode;
      let subtotal = req.body.Subtotal;
      let grandtotal;
      let couponMsg;
      couponSchema
        .find({ CODE: couponCode, Status: "ACTIVE" })
        .then((result) => {
          if (result.length == 0) {
            couponMsg = "Coupon Invalid";
            res.json({ status: false, couponMsg });
          } else {
            let couponType = result[0].couponType;
            let cutOff = parseInt(result[0].cutOff);
            let maxRedeemAmount = parseInt(result[0].maxRedeemAmount);
            let minCartAmount = parseInt(result[0].minCartAmount);
            let generateCount = parseInt(result[0].generateCount);

            if (generateCount != 0) {
              if (couponType == "Amount") {
                if (subtotal < minCartAmount) {
                  couponMsg =
                    "Minimum Rs." +
                    minCartAmount +
                    " need to Apply this Coupon";
                  res.json({ status: false, couponMsg });
                } else {
                  grandtotal = Math.round(subtotal - cutOff);
                  let response = {
                    status: true,
                    grandtotal: grandtotal,
                    couponMsg,
                    CutOff: cutOff,
                  };
                  res.json(response);
                }
              } else if ((couponType = "Percentage")) {
                if (subtotal < minCartAmount) {
                  couponMsg =
                    "Minimum Rs." +
                    minCartAmount +
                    " need to Apply this Coupon";
                  res.json({ status: false, couponMsg });
                } else {
                  let reduceAmount = Math.round((subtotal * cutOff) / 100);
                  if (reduceAmount > maxRedeemAmount) {
                    grandtotal = Math.round(subtotal - maxRedeemAmount);
                    let response = {
                      status: true,
                      grandtotal: grandtotal,
                      couponMsg,
                      CutOff: maxRedeemAmount,
                    };
                    res.json(response);
                  } else {
                    grandtotal = Math.round(subtotal - reduceAmount);
                    let response = {
                      status: true,
                      grandtotal: grandtotal,
                      couponMsg,
                      CutOff: reduceAmount,
                    };
                    res.json(response);
                  }
                }
              }
            } else {
              couponMsg = "Coupon limit Exceeded";
              res.json({ status: false, couponMsg });
            }
          }
        });
    } catch (err) {
      console.log(err);
    }
  },

  // request for cancel an order
  getCancelOrder: async (req, res) => {
    try {
      orderId = req.query.id;
      let order = await orderSchema.findById(orderId);
      order.orderStatus = "Cancelled";
      order.save();
    } catch (err) {
      console.log(err);
    }
  },
};
