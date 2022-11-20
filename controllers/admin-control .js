const express = require("express");
const { resolve } = require("path");
const router = express.Router();
const bcrypt = require("bcrypt");
const { access } = require("fs");
const session = require("express-session");
const saltRounds = 10;
const fs = require('fs');

//err msg variables
let errMsg = null;
let couponExistErr = null;

//schemas
const productSchema = require("../model/Product-model");
const adminSchema = require("../model/admin-model");
const userSchema = require("../model/user-model");
const categorySchema = require("../model/category-model");
const orderSchema = require("../model/order-model");
const BannerSchema = require("../model/banner-model");
const CouponSchema = require("../model/coupon-model");

module.exports = {
  //get verify login page
  getLogin: (req, res) => {
    try {
      if (req.session.adminLoggedIn) {
        res.redirect("/admin/");
      } else {
        res.render("admin/login", { errMsg });
        errMsg = null;
      }
    } catch (err) {
      console.log(err);
    }
  },

  //submit login form
  postLogin: (req, res) => {
    try {
      adminSchema
        .findOne({ Email: req.body.Email })
        .then(async (adminData) => {
          let state = await bcrypt.compare(
            req.body.Password,
            adminData.Password
          );
          if (state) {
            req.session.adminLoggedIn = true;
            req.session.adminData = adminData;
            res.redirect("/admin/");
          } else {
            res.redirect("/admin/login");
            errMsg = "Incorrect Password";
          }
        })
        .catch((err) => {
          errMsg = "Incorrect Email";
          res.redirect("/admin/login");
        });
    } catch (err) {
      console.log(err);
    }
  },

  //get dashboard page
  getDashboard: async (req, res) => {
    try {
      let orderCount = 0;
      let userCount = 0;
      let totalEarnings = 0;
      let shippedCount = 0;
      let deliveredCount = 0;
      let pendingCount = 0;

      let orders = await orderSchema.find();
      let users = await userSchema.find();

      orderCount = orders.length;
      userCount = users.length;
      await orderSchema
        .aggregate([
          {
            $match: {
              paymentStatus: "Payment Completed",
            },
          },
          {
            $group: {
              _id: null,
              Amount: { $sum: "$Subtotal" },
            },
          },
        ])
        .then((result) => {
          if (result.length != 0) {
            totalEarnings = result[0].Amount;
          }
        });
      await orderSchema
        .aggregate([
          {
            $match: {
              orderStatus: "Shipped",
            },
          },
          {
            $count: "Count",
          },
        ])
        .then((result) => {
          if (result.length != 0) {
            shippedCount = result[0].Count;
          }
        });
      await orderSchema
        .aggregate([
          {
            $match: {
              orderStatus: "Delivered",
            },
          },
          {
            $count: "Count",
          },
        ])
        .then((result) => {
          if (result.length != 0) {
            deliveredCount = result[0].Count;
          }
        });

      await orderSchema
        .aggregate([
          {
            $match: {
              orderStatus: "Order Pending",
            },
          },
          {
            $count: "Count",
          },
        ])
        .then((result) => {
          if (result.length != 0) {
            pendingCount = result[0].Count;
          }
        });

      let graphOrderCompleteData = await orderSchema.aggregate([
        {
          $project: {
            Date: { $dateToString: { format: "%d-%m-%Y", date: "$Date" } },
            OrderStatus: "$orderStatus",
          },
        },
        {
          $match: {
            OrderStatus: "Delivered",
          },
        },
        {
          $group: {
            _id: "$Date",
            count: { $sum: 1 },
          },
        },
        {
          $sort: {
            _id: -1,
          },
        },
        { $limit: 7 },
      ]);

      let graphOrderCancelledData = await orderSchema.aggregate([
        {
          $project: {
            Date: { $dateToString: { format: "%d-%m-%Y", date: "$Date" } },
            OrderStatus: "$orderStatus",
          },
        },
        {
          $match: {
            OrderStatus: "Cancelled",
          },
        },
        {
          $group: {
            _id: "$Date",
            count: { $sum: 1 },
          },
        },
        {
          $sort: {
            _id: -1,
          },
        },
        { $limit: 7 },
      ]);

      var DateSpan = [];
      for (var i = 0; i < 7; i++) {
        var currentDate = new Date();
        currentDate.setDate(currentDate.getDate() - i);
        var $dd = currentDate.getDate();
        var $mm = currentDate.getMonth() + 1; //January is 0!
        var $yyyy = currentDate.getFullYear();
        if ($dd < 10) {
          $dd = "0" + $dd;
        }
        if ($mm < 10) {
          $mm = "0" + $mm;
        }
        currentDate = $dd + "-" + $mm + "-" + $yyyy;
        DateSpan.push(currentDate);
      }
      let finalOrderCompletedata = [];
      for (i = 0; i < graphOrderCompleteData.length; i++) {
        for (j = 0; j < DateSpan.length; j++) {
          if (graphOrderCompleteData[i] != undefined) {
            if (DateSpan[j] == graphOrderCompleteData[i]._id) {
              finalOrderCompletedata.push(graphOrderCompleteData[i].count);
              i++;
            } else {
              finalOrderCompletedata.push(0);
            }
          } else {
            finalOrderCompletedata.push(0);
          }
        }
      }

      let finalOrdercanceldata = [];
      for (i = 0; i < graphOrderCancelledData.length; i++) {
        for (j = 0; j < DateSpan.length; j++) {
          if (graphOrderCancelledData[i] != undefined) {
            if (DateSpan[j] == graphOrderCancelledData[i]._id) {
              finalOrdercanceldata.push(graphOrderCancelledData[i].count);
              i++;
            } else {
              finalOrdercanceldata.push(0);
            }
          } else {
            finalOrdercanceldata.push(0);
          }
        }
      }
      let ordersList = await orderSchema.find().sort({ Date: -1 }).limit(10);

      res.render("admin/dashboard", {
        session: req.session,
        orderCount,
        userCount,
        totalEarnings,
        pendingCount,
        shippedCount,
        deliveredCount,
        DateSpan,
        finalOrderCompletedata,
        finalOrdercanceldata,
        ordersList,
      });
    } catch (err) {
      console.log(err);
    }
  },

  //get product list page
  getProductsList: (req, res) => {
    try {
      productSchema.find({ Delete: false }).then((Products) => {
        // console.log(Products);
        if (Products[0]) {
          res.render("admin/productsList", {
            ProductState: true,
            Products,
            session: req.session,
          });
        } else {
          res.render("admin/productsList", {
            ProductState: false,
            session: req.session,
          });
        }
      });
    } catch (err) {
      console.log(err);
    }
  },

  //get add product page
  getAddProducts: (req, res) => {
    try {
      categorySchema.find().then((Categories) => {
        if (req.session.adminLoggedIn) {
          res.render("admin/addProducts", { session: req.session, Categories });
        } else {
          res.redirect("/admin/login");
        }
      });
    } catch (err) {
      console.log(err);
    }
  },

  //request to submit add product
  postAddProducts: (req, res) => {
    try {
      return new Promise(async (resolve, reject) => {
        let files = req.files;
        if (files) {
          const Images = [];
          for (i = 0; i < req.files.length; i++) {
            Images[i] = files[i].filename;
          }
          req.body.images = Images;
        }

        const Name = req.body.productName;
        const Description = req.body.productDescription;
        const Category = req.body.category;
        const SellingPrize = req.body.sellingPrize;
        const CostPrize = req.body.costPrize;
        const Quantity = req.body.quantity;
        const Colour = req.body.colour;
        const Images = req.body.images;
        const Delete = false;

        const product = new productSchema({
          Name: Name,
          Description: Description,
          Category: Category,
          SellingPrize: SellingPrize,
          CostPrize: CostPrize,
          Quantity: Quantity,
          Images: Images,
          Colour: Colour,
          Delete: Delete,
        });

        product
          .save()
          .then((result) => {
            res.redirect("/admin/products");
          })
          .catch((err) => {
            console.log(err);
          });
      });
    } catch (err) {
      console.log(err);
    }
  },

  //get product edit page
  getEditProducts: (req, res) => {
    try {
      productSchema
        .findOne({ _id: req.query.id })
        .then((result) => {
          categorySchema.find().then((Categories) => {
            res.render("admin/editProducts", {
              Product: result,
              session: req.session,
              Categories,
            });
          });
        })
        .catch((err) => {
          console.log(err);
        });
    } catch (err) {
      console.log(err);
    }
  },

  //request for submit edited product
  postEditProducts: async (req, res) => {
    try {
      let files = req.files;
      if (files.length != 0) {
        const Images = [];
        for (i = 0; i < req.files.length; i++) {
          Images[i] = files[i].filename;
        }
        let Product = await productSchema.findOne({ _id: req.query.id });
        (Product.Name = req.body.productName),
          (Product.Description = req.body.productDescription),
          (Product.Category = req.body.category),
          (Product.SellingPrize = req.body.sellingPrize),
          (Product.CostPrize = req.body.costPrize),
          (Product.Quantity = req.body.quantity),
          (Product.Colour = req.body.colour);

          for(i=0;i<Product.Images.length;i++){
            fs.unlink('./public/productImages/'+Product.Images[i],(err)=>{
                if(err){
                    console.log(err);
                }
              })
          }
          

        req.body.images = Images;
        Product.Images = req.body.images;

        Product.save()
          .then((result) => {
            res.redirect("/admin/products");
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        let Product = await productSchema.findOne({ _id: req.query.id });
        (Product.Name = req.body.productName),
          (Product.Description = req.body.productDescription),
          (Product.Category = req.body.category),
          (Product.SellingPrize = req.body.sellingPrize),
          (Product.CostPrize = req.body.costPrize),
          (Product.Quantity = req.body.quantity),
          (Product.Colour = req.body.colour);

        Product.save()
          .then((result) => {
            res.redirect("/admin/products");
          })
          .catch((err) => {
            console.log(err);
          });
      }
    } catch (err) {
      console.log(err);
    }
  },

  //request for delete a product
  getDeleteProduct: async (req, res) => {
    try {
      let Product = await productSchema.findOne({ _id: req.query.id });
      Product.Delete = true;
      Product.save()
        .then((result) => {
          res.redirect("/admin/products");
        })
        .catch((err) => {
          console.log(err);
        });
      res.json({ state: true });
    } catch (err) {
      console.log(err);
    }
  },

  //get customerslist page
  getCustomers: (req, res) => {
    try {
      userSchema.find().then((users) => {
        res.render("admin/customerList", { users, session: req.session });
      });
    } catch (err) {
      console.log(err);
    }
  },

  //request for block an user
  getBlockUser: (req, res) => {
    try {
      userSchema
        .updateOne({ _id: req.query.id }, { $set: { access: false } })
        .then((result) => {
          res.redirect("/admin/customers");
        });
    } catch (err) {
      console.log(err);
    }
  },

  //request for unblock an user
  getUnBlockUser: (req, res) => {
    try {
      userSchema
        .updateOne({ _id: req.query.id }, { $set: { access: true } })
        .then((result) => {
          res.redirect("/admin/customers");
        });
    } catch (err) {
      console.log(err);
    }
  },

  //get categoryList page
  getCategory: (req, res) => {
    try {
      categorySchema.find().then((result) => {
        res.render("admin/categoryList", {
          Categories: result,
          session: req.session,
        });
      });
    } catch (err) {
      console.log(err);
    }
  },

  //get add product page
  getAddCategory: (req, res) => {
    try {
      res.render("admin/addCategory", { session: req.session, errMsg });
      errMsg = null;
    } catch (err) {
      console.log(err);
    }
  },

  //request submit new category
  postAddCategory: (req, res) => {
    try {
      categorySchema.find({ Name: req.body.Name }).then((result) => {
        if (result[0] == undefined) {
          const Image = req.file.filename;
          const category = new categorySchema({
            Name: req.body.Name,
            Image: Image,
          });
          category.save().then((result) => {
            res.redirect("/admin/addCategory");
          });
        } else {
          res.redirect("/admin/addCategory");
          errMsg = "Category Already Exist";
        }
      });
    } catch (err) {
      console.log(err);
    }
  },

  //request for delete a category
  getDeleteCategory: (req, res) => {
    try {
      categorySchema.deleteOne({ id: req.query.id }).then((result) => {
        res.redirect("/admin/categoryList");
      });
    } catch (err) {
      console.log(err);
    }
  },

  //get edit category page
  getEditCategory: (req, res) => {
    try {
      categorySchema.findOne({ id: req.query.id }).then((result) => {
        res.render("admin/editCategory", {
          category: result,
          session: req.session,
        });
      });
    } catch (err) {
      console.log(err);
    }
  },

  //request to submit editted category
  postEditCategory: (req, res) => {
    try {
      categorySchema
        .updateOne(
          { id: req.query.id },
          {
            $set: {
              Name: req.body.Name,
            },
          }
        )
        .then((result) => {
          res.redirect("/admin/categoryList");
        });
    } catch (err) {
      console.log(err);
    }
  },

  //requset for logout Admin
  getAdminLogout: (req, res) => {
    try {
      req.session.adminLoggedIn = null;
      req.session.adminData = null;
      res.redirect("/admin/login");
    } catch (err) {
      console.log(err);
    }
  },

  //get orderList page
  getOrders: (req, res) => {
    try {
      orderSchema
        .find()
        .sort({ Date: -1 })
        .then((orders) => {
          res.render("admin/orderList", {
            session: req.session,
            Orders: orders,
          });
        });
    } catch (err) {
      console.log(err);
    }
  },

  //get orderSummary page
  getOrderSummary: (req, res) => {
    try {
      orderSchema.findById(req.query.id).then((result) => {
        // console.log(result);
        res.render("admin/orderSummary", {
          session: req.session,
          Order: result,
        });
      });
    } catch (err) {
      console.log(err);
    }
  },

  //request for change order status
  getChangeOrderStatus: (req, res) => {
    try {
      let orderId = req.query.id;
      let status = req.body.value;
      if (status == "Delivered") {
        orderSchema
          .findByIdAndUpdate(orderId, {
            orderStatus: req.body.value,
            paymentStatus: "Payment Completed",
          })
          .then((result) => {});
      } else {
        orderSchema
          .findByIdAndUpdate(orderId, { orderStatus: req.body.value })
          .then((result) => {});
      }

      res.json({ status: true });
    } catch (err) {
      console.log(err);
    }
  },

  //get error page
  getError: (req, res) => {
    try {
      res.render("admin/error");
    } catch (err) {
      console.log(err);
    }
  },

  //get bannerlist
  getBannerList: (req, res) => {
    try {
      BannerSchema.find().then((result) => {
        res.render("admin/bannerList", {
          session: req.session,
          Banners: result,
        });
      });
    } catch (err) {
      console.log(err);
    }
  },

  //get add new banner page
  getAddBanner: (req, res) => {
    try {
      res.render("admin/addBanner", { session: req.session });
    } catch (err) {
      console.log(err);
    }
  },

  //request to add new banner
  postAddBanner: (req, res) => {
    try {
      const Banner = new BannerSchema({
        Title: req.body.Title,
        Description: req.body.Description,
        Image: req.file.filename,
      });
      Banner.save().then((result) => {});
      res.redirect("/admin/banners");
    } catch (err) {
      console.log(err);
    }
  },

  //request for remove banner
  getRemoveBanner: (req, res) => {
    try {
      BannerSchema.deleteOne({ _id: req.query.id }).then((result) => {
        res.redirect("/admin/Banners");
      });
    } catch (err) {
      console.log(err);
    }
  },

  //get coupon list page
  getCouponList: async (req, res) => {
    try {
      let Coupons = await CouponSchema.find();

      res.render("admin/couponList", {
        Coupons,
        session: req.session,
      });
    } catch (err) {
      console.log(err);
    }
  },

  //request to add new coupon
  getAddCoupon: (req, res) => {
    try {
      res.render("admin/addCoupon", {
        session: req.session,
        couponExistErr,
      });
      couponExistErr = null;
    } catch (err) {
      console.log(err);
    }
  },

  //request for submit new coupon
  postAddCoupon: (req, res) => {
    try {
      let Code = req.body.Code;
      let CutOff = req.body.CutOff;
      let couponType = req.body.CouponType
      let minCartAmount = req.body.minAmount
      let maxRedeemAmount = req.body.maxAmount
      let generateCount = req.body.generateCount
      let expireDate = req.body.expireDate
      Code = Code.toUpperCase();

      CouponSchema.find({ CODE: Code }).then((result) => {
        if (result.length == 0) {
          const Coupon = new CouponSchema({
            CODE: Code,
            cutOff: CutOff,
            couponType:couponType,
            minCartAmount:minCartAmount,
            maxRedeemAmount:maxRedeemAmount,
            generateCount:generateCount,
            expireDate:expireDate
          });
          Coupon.save().then((result) => {
            res.redirect("/admin/couponList");
          });
        } else {
          couponExistErr = "Coupon Already Exist";
          res.redirect("/admin/addCoupon");
        }
      });
    } catch (err) {
      console.log(err);
    }
  },

  //request for coupon activate
  couponActivate: async (req, res) => {
    console.log('ok');
    try {
      CouponSchema.updateOne(
        { _id: req.query.id },
        { $set: { status: "ACTIVE" } }
      ).then((result) => {
        res.redirect("/admin/couponList");
      });
    } catch (err) {
      console.log(err);
    }
  },

  //request for coupon block
  couponBlock: (req, res) => {
    console.log('ok');
    try {
      CouponSchema.updateOne(
        { _id: req.query.id },
        { $set: { status: "BLOCKED" } }
      ).then((result) => {
        res.redirect("/admin/couponList");
      });
    } catch (err) {
      console.log(err);
    }
  },

  //get sales page
  getSales : async(req,res)=>{
    try{
      let orders= await orderSchema.find({paymentStatus:'Payment Completed'})
        res.render('admin/sales',{session: req.session,orders})
      
    }catch(err){
        console.log(err);
    }
  },

  //get sales report with time period
  getSalesReport : (req,res)=>{
    try{
    let timePeriod = req.body.timePeriod
    if(timePeriod=='All'){
      orderSchema.aggregate([
        {
          $match: {
            paymentStatus:'Payment Completed',
          },
        },
        {
          $project: {
            Date: { $dateToString: { format: "%d/%m/%Y", date: "$Date" } },
            Time: { $dateToString: { format: "%H:%M:%S", date: "$Date"}},  
            paymentStatus: "$paymentStatus",
            Address : '$Address',
            Subtotal : "$Subtotal",
            orderStatus : "$orderStatus"
          },
        },
        
        
      ]).then((result)=>{
        console.log(result);
        res.json({order:result})
      })
    }else if(timePeriod=='Today'){
      let today = new Date(new Date().getTime()-(24*60*60*1000));

 
      orderSchema.aggregate([
        {
          $match: {
            paymentStatus:'Payment Completed',
            Date :{$gte : today}
          },
        },
        {
          $project: {
            Date: { $dateToString: { format: "%d/%m/%Y", date: "$Date" } },
            Time: { $dateToString: { format: "%H:%M:%S", date: "$Date"}},  
            paymentStatus: "$paymentStatus",
            Address : '$Address',
            Subtotal : "$Subtotal",
            orderStatus : "$orderStatus"
          },
        },
        
        
      ]).then((result)=>{
        console.log(result);
        res.json({order:result})
      })
      
    }else if(timePeriod=='Weekly'){
      let weekly = new Date(new Date().getTime()-(7*24*60*60*1000))


      orderSchema.aggregate([
        {
          $match: {
            paymentStatus:'Payment Completed',
            Date :{$gte : weekly}
          },
        },
        {
          $project: {
            Date: { $dateToString: { format: "%d/%m/%Y", date: "$Date" } },
            Time: { $dateToString: { format: "%H:%M:%S", date: "$Date"}},  
            paymentStatus: "$paymentStatus",
            Address : '$Address',
            Subtotal : "$Subtotal",
            orderStatus : "$orderStatus"
          },
        },
        
      ]).then((result)=>{
        console.log(result)
        res.json({order:result})
      })
    }else if(timePeriod=='Monthly'){
      let monthly = new Date(new Date().getTime()-(30*24*60*60*1000));
      orderSchema.aggregate([
        {
          $match: {
            paymentStatus:'Payment Completed',
            Date :{$gte : monthly}
          },
        },
        {
          $project: {
            Date: { $dateToString: { format: "%d/%m/%Y", date: "$Date" } },
            Time: { $dateToString: { format: "%H:%M:%S", date: "$Date"}},  
            paymentStatus: "$paymentStatus",
            Address : '$Address',
            Subtotal : "$Subtotal",
            orderStatus : "$orderStatus"
          },
        },
        
      ]).then((result)=>{
        res.json({order:result})
      })
    }else if(timePeriod=='Yearly'){
      let yearly = new Date(new Date().getTime()-(12*30*24*60*60*1000));
      orderSchema.aggregate([
        {
          $match: {
            paymentStatus:'Payment Completed',
            Date :{$gte : yearly}
          },
        },
        {
          $project: {
            Date: { $dateToString: { format: "%d/%m/%Y", date: "$Date" } },
            Time: { $dateToString: { format: "%H:%M:%S", date: "$Date"}},  
            paymentStatus: "$paymentStatus",
            Address : '$Address',
            Subtotal : "$Subtotal",
            orderStatus : "$orderStatus"
          },
        },
        
      ]).then((result)=>{
        res.json({order:result})
      })
    }
    }catch(err){
      console.log(err);
    }
  }
};
