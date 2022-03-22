/**
 * 用户管理模块
 */
const router = require('koa-router')()
const User = require("../models/userSchema")
const util = require("../utils/utils")
const jwt = require("jsonwebtoken")
router.prefix('/users')
router.post("/login",async (ctx)=>{
  try{
    const {userName,userPwd} = ctx.request.body
    const res = await User.findOne({userName,userPwd})
    const token = jwt.sign({
      data:res._doc,
    },"imooc",{expiresIn:10})
    if(res){
      let initRes = {
        code:200,
        data:{...res._doc,token},
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

router.get("/leave/count", async (ctx)=>{
  jwt.verify(ctx.header.authorization,"imooc",(error,authData)=>{
    /**
     * error 报错信息
     * authData 解析出来的token数据
     */
  })
  ctx.body = {
    code:200,
    data:{},
    msg:"success"
  }
})


module.exports = router
