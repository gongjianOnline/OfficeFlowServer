const router = require('koa-router')()
const util = require("../utils/utils")
const Dept = require("../models/deptSchema");

router.prefix("/dept")
// 部门列表
router.get("/list",async (ctx)=>{
  let {deptName} = ctx.request.query;
  let params = {};
  if(deptName){params.deptName = deptName}
  let rootList = await Dept.find(params)
  if(deptName){
    ctx.body = util.success({
      code:200,
      data:rootList,
      msg:"查询成功"
    })
  }else{
    let tressList = getTreeDepts(rootList,null,[])
    ctx.body = util.success({
      code:200,
      data:tressList,
      msg:"查询成功"
    })
  }
  
  
})
// 递归拼接树形列表
function getTreeDepts(rootList, id, list) {
  for (let i = 0; i < rootList.length; i++) {
    let item = rootList[i]
    if (String(item.parentId.slice().pop()) == String(id)) {
      list.push(item._doc)
    }
  }
  list.map(item => {
    item.children = []
    getTreeDepts(rootList, item._id, item.children)
    if (item.children.length == 0) {
      delete item.children;
    }
  })
  return list;
}


// 部门增删改
router.post("/operate",async (ctx)=>{
  const {_id,action,...params} = ctx.request.body;
  let res,info;
  try {
    if(action === "create"){
      res = await Dept.create(params);
      info = "创建成功"
    }else if(action === 'edit'){
      params.updateTime = new Date();
      res = await Dept.findByIdAndUpdate(_id,params)
      info = "编辑成功"
    }else if(action === "delete"){
      res = await Dept.findByIdAndRemove(_id);
      await Dept.deleteMany({parentId:{$all:[_id]}})
      info = "删除成功"
    }
    ctx.body = util.success({
      code:200,
      data:{},
      msg:info
    })
  } catch (error) {
    tx.body = util.fail("","操作失败","")
  }
})

module.exports = router;