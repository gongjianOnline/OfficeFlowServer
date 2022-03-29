/**
 * 用户管理模块
 */
const router = require('koa-router')()
const User = require("../models/userSchema")
const util = require("../utils/utils")
const jwt = require("jsonwebtoken")
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
      ctx.body = util.fail("","参数错误", util.CODE.PARAM_ERROR);
      return;
    }
  } else {
    if (!deptId) {
      ctx.body = util.fail("","部门不能为空", util.CODE.PARAM_ERROR);
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
      ctx.body = util.fail("","更新失败",util.CODE.BUSINESS_ERROR)
    }
  }
})


module.exports = router
