/**
 * 用户管理模块
 */
const router = require('koa-router')()
const User = require("../models/userSchema")
const util = require("../utils/utils")
router.prefix('/users')
router.post("/login",async (ctx)=>{
  try{
    const {userName,userPwd} = ctx.request.body
    const res = await User.findOne({userName,userPwd})
    if(res){
      let initRes = {
        code:200,
        data:res,
        msg:"请求成功"
      }
      ctx.body = util.success(initRes)
    }else{
      ctx.body = util.fail({},"账号或密码不正确")
    }
  } catch (error){
    ctx.body = util.fail("")
  }
  
})


module.exports = router
