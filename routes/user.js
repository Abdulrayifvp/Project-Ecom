const express = require('express')
const router = express.Router()
const userControl = require('../controllers/user-control')


router.get('/',userControl.getIndex)
router.get('/login',userControl.getLogin)
router.post('/login',userControl.postLogin)
router.get('/signup',userControl.getSignup)
router.post('/signup',userControl.postSignup)
router.get('/verifyOtp',userControl.getVerifyOtp)



module.exports = router;