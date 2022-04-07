const router = require('koa-router')()
const util = require("../utils/utils")
const role = require("../models/roleSchema")
router.prefix("/menu")

module.exports = router