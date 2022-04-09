
/**
 *维护用户ID自增长表
 */
const mongoose = require("mongoose")
const userSchema =  mongoose.Schema({
  _id:String,
  sequence_value:Number
})
module.exports = mongoose.model("counter",userSchema,"counters")
/**接受三个参数
 * 模型名称
 * 模型
 * 集合名称
 */
