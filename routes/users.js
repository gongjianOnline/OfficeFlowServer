/**
 * 用户管理模块
 */
const router = require('koa-router')()
const User = require("../models/userSchema")
const Menu = require("../models/menuSchema")
const Role = require("../models/roleSchema")
const Counter = require("../models/counterSchema")
const util = require("../utils/utils")
const jwt = require("jsonwebtoken")
const md5 = require("md5")
router.prefix('/users')
// 用户登录接口
router.post("/login", async (ctx) => {
  try {
    const { userName, userPwd } = ctx.request.body
    const res = await User.findOne({ userName, userPwd })
    const token = jwt.sign({
      data: res._doc,
    }, "imooc", { expiresIn: '1d' })
    if (res) {
      let initRes = {
        code: 200,
        data: { ...res._doc, token },
        msg: "请求成功"
      }
      ctx.body = util.success(initRes)
    } else {
      ctx.body = util.fail({}, "账号或密码不正确")
    }
  } catch (error) {
    ctx.body = util.fail("")
  }

})
// 测试token
router.get("/leave/count", async (ctx) => {
  jwt.verify(ctx.header.authorization, "imooc", (error, authData) => {
    /**
     * error 报错信息
     * authData 解析出来的token数据
     */
  })
  ctx.body = {
    code: 200,
    data: {},
    msg: "success"
  }
})

// 获取所有用户列表
router.get("/all/list",async (ctx)=>{
  try {
    const list = await User.find({},"userId userName userEmail")
    ctx.body = util.success({
      code:200,
      data:list,
      msg:"查询成功"
    })
  } catch (error) {
    ctx.body = util.fail("","查询失败","")
  }
})

// 用户列表
router.get("/all/list", async (ctx) => {
  const { userId, userName, state } = ctx.request.query
  const { page, skipIndex } = util.pager(ctx.request.query)
  let params = {};
  if (userId) { params.userId = userId }
  if (userName) { params.userName = userName }
  if (state && state != '0') { params.state = state }
  // 根据条件查询所有用户列表并分页和获取总条数
  try {
    const query = User.find(params, { _id: 0, userPwd: 0 })
    const list = await query.skip(skipIndex).limit(page.pageSize)
    const total = await User.countDocuments(params)
    let initRes = {
      code: 200,
      data: {
        list: [...list],
        page: { total }
      },
      msg: "请求成功"
    }
    ctx.body = util.success(initRes)
  } catch (error) {
    ctx.body = util.fail(`查询异常：${error.stack}`)
  }
})

// 删除用户和批量删除
router.post("/delete", async (ctx) => {
  // 需要删除的用户ID数组
  const { userIds } = ctx.request.body;
  const res = await User.updateMany({
    userId: { $in: userIds },
  }, { state: 2 })
  if (res) {
    ctx.body = util.success({
      code: 200,
      data: res,
      msg: `共删除${res.nModified}条`
    })
    return
  } else {
    ctx.body = util.fail("删除失败")
  }
})

// 用户新增/编辑
router.post("/operate", async (ctx) => {
  const {
    userId,
    userName,
    userEmail,
    mobile,
    job,
    state,
    roleList,
    deptId,
    action
  } = ctx.request.body;
  if (action === "add") {
    if (!userName || !userEmail || !deptId) {
      ctx.body = util.fail("", "参数错误", util.CODE.PARAM_ERROR);
      return;
    }
    // 自增ID
    const doc = await Counter.findOneAndUpdate({ _id: 'userId' }, { $inc: { sequence_value: 1 } }, { new: true })
    const res = await User.findOne({$or:[{userName,userEmail}]},"_id userName userEmail")
    if(res){
      ctx.body = util.fail("",`${res.userName} - ${res.userEmail}信息重复`,util.CODE.BUSINESS_ERROR)
    }else{
      const user = new User({
        userId:doc.sequence_value,
        userName,
        userPwd:md5('admin'),
        userEmail,
        role:1,// 默认为普通用户
        roleList,
        job,
        state,
        deptId,
        mobile
      })
      user.save()
      ctx.body = util.success({
        code:200,
        data:'',
        msg:"添加成功"
      })
    }
  } else {
    if (!deptId) {
      ctx.body = util.fail("", "部门不能为空", util.CODE.PARAM_ERROR);
      return;
    }
    // 查找并替换
    const res = await User.findOneAndUpdate({ userId }, { mobile, job, state, roleList, deptId });
    if (res) {
      ctx.body = util.success({
        code: 200,
        data: { ...res },
        msg: "更新成功"
      })
    } else {
      ctx.body = util.fail("", "更新失败", util.CODE.BUSINESS_ERROR)
    }
  }
})

// 获取用户对象的权限菜单
router.get("/getPermissionList",async (ctx)=>{
  const authorization = ctx.request.headers.authorization;
  let {data} = util.decoded(authorization)
  let menuList = await getMenuList(data.role,data.roleList)
  let actionList = getActionList(JSON.parse(JSON.stringify(menuList)))
  ctx.body = util.success({
    code:200,
    data:{menuList,actionList},
    msg:"解析成功"
  })
})
async function getMenuList(userRole,roleKeys){
  let rootList = []
  if(userRole == 0){
    rootList = await Menu.find({}) || ""
  }else{
    // 根据用户拥有的角色获取权限列表
    // 查找用户对应的角色有哪些
    let roleList = await Role.find({_id:{$in:roleKeys}})
    let permissionList = [];
    roleList.map((role)=>{
      let {checkedKeys,halfCheckedKeys} = role.permissionList;
      permissionList = permissionList.concat([...checkedKeys,...halfCheckedKeys])
    })
    permissionList = [...new Set(permissionList)]
    rootList = await Menu.find({_id:{$in:permissionList}})
  }
  return util.getTreeMenu(rootList,null,[])
}
function getActionList(list){
  const actionList = [];
  const deep = (arr)=>{
    while(arr.length){
      let item = arr.pop();
      if(item.action){
        item.action.map((action)=>{
          actionList.push(action.menuCode)
        })
      }
      if(item.children && !item.action){
        deep(item.children)
      }
    }
  }
  deep(list)
  return actionList
}
module.exports = router
