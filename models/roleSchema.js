const mongoose = require("mongoose")
const roleSchema = mongoose.Schema({
  roleName:String,
  remark:String,
  PermissionList:{
    checkedkeys:[],
    halfCheckedkeys:[]
  },
  createTime:{
    type:Date,
    default:Date.now()
  }
})

module.exports = mongoose.model("role",roleSchema,"users")