const express = require('express')
const multer = require('multer')
const router = express.Router()
const userControl = require('../controllers/user-control')
const checkLoggin = require('../middlewares/checkLoggedIn')




router.get('/',userControl.getIndex)
router.get('/login',userControl.getLogin)
router.post('/login',userControl.postLogin)
router.get('/signup',userControl.getSignup)
router.post('/signup',userControl.postSignup)
router.get('/verifyOtp',userControl.getVerifyOtp)
router.get('/viewProduct',userControl.getViewProduct)
router.get('/cart',checkLoggin,userControl.getCart)
router.get('/logout',checkLoggin,userControl.getLogout)
router.post('/addToCart',checkLoggin,userControl.postAddToCart)
router.get('/addToCart',checkLoggin,userControl.getAddToCart)
router.get('/quantityInc',checkLoggin,userControl.getQuantityInc)
router.get('/quantityDec',checkLoggin,userControl.getQuantityDec)
router.get('/removeCartItem',checkLoggin,userControl.getRemoveCartItem)
router.get('/wishlist',checkLoggin,userControl.getWishlist)
router.get('/addToWishlist',checkLoggin,userControl.getAddToWishlist)
router.get('/removeFromWishlist',checkLoggin,userControl.getRemoveFromWishlist)
router.get('/checkout',checkLoggin,userControl.getCheckOut)
router.post('/placeOrder',checkLoggin,userControl.getPlaceOrder)
router.get('/orders',checkLoggin,userControl.getMyOrders)
router.get('/orderSummary',checkLoggin,userControl.getOrderSummary)
router.post('/verifyPayment',checkLoggin,userControl.postVerifyPayment)
router.post('/paymentFailed',checkLoggin,userControl.postPaymentFailed)




module.exports = router;