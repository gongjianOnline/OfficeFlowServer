const router = require('koa-router')()
const util = require("../utils/utils")
const Role = require("../models/roleSchema")
router.prefix("/roles")

// 查询所有的角色列表
router.get("/allList",async (ctx)=>{
  try {
    const list = await Role.find({},'_id roleName')
    ctx.body = util.success({
      code:200,
      data:list,
      msg:"查询成功"
    })
  } catch (error) {
    ctx.body = util.fail("","查询失败",util.CODE.PARAM_ERROR)
  }
})

// 按页数获取角色列表
router.get("/list",async (ctx)=>{
  const { roleName } = ctx.request.query;
  const {page,skipIndex} = util.pager(ctx.request.query)
  try{
    let params = {};
    if(roleName){
      params.roleName = roleName
    }
    const query = Role.find({});
    const list = await query.skip(skipIndex).limit(page.pageSize);
    const total = await Role.countDocuments(params)
    ctx.body = util.success({
      code:200,
      data:{
        list,
        page:{
          ...page,
          total
        }
      }
    })
  }catch(error){
    ctx.body = util.fail("","查询失败",util.CODE.PARAM_ERROR)
  }
})

// 角色的操作 增删改
router.post("/operate",async (ctx)=>{
  const { _id, roleName, remark, action } = ctx.request.body;
  let res,info;
  try {
    if(action == "create"){
      res = await Role.create({roleName,remark})
      info = "创建成功"
    }else if(action == "edit"){
      if (_id) {
        let params = { roleName, remark }
        params.update = new Date();
        res = await Role.findByIdAndUpdate(_id, params)
        info = "编辑成功"
      } else {
        ctx.body = util.fail("","缺少参数params: _id","")
        return;
      }
    }else{
      if(!_id){
        ctx.body = util.fail("","缺少参数params: _id","")
        return 
      }
     res = await Role.findByIdAndRemove(_id)
     info = "删除成功"
    }
    ctx.body = util.success({
      code:200,
      data:"",
      msg:info
    })
  } catch (error) {
    ctx.body = util.fail("","操作失败","")
  }
})


// 权限设置
router.post("/update/permission",async (ctx)=>{
  const {_id,permissionList} = ctx.request.body;
  try {
    let params = {permissionList,update:new Date()}
    let res = await Role.findByIdAndUpdate(_id,params);
    ctx.body = util.success({
      code:200,
      data:"",
      msg:"权限设置成功"
    })
  } catch (error) {
    util.fail("","权限设置失败","")
  }
})
module.exports = router