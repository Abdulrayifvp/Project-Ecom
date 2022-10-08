const express = require('express')
const router = express.Router()
const adminControl = require('../controllers/admin-control ')

router.get('/',adminControl.getIndex)

module.exports = router