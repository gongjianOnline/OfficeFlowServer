const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
// const logger = require('koa-logger')
const log4js = require("./utils/log4j")
const koajwt = require('koa-jwt')
const util = require("./utils/utils")
const { Logger } = require('log4js')

// 路由管理
const index = require('./routes/index')
const users = require('./routes/users')
const menus = require('./routes/menus')
const role = require('./routes/role')

// error handler
onerror(app)

require("./config/db")

// middlewares
app.use(bodyparser({
  enableTypes:['json', 'form', 'text']
}))
app.use(json())
// app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

app.use(views(__dirname + '/views', {
  extension: 'pug'
}))

// logger
app.use(async (ctx, next) => {
  log4js.info('log output')
  await next().catch((err)=>{
    if(err.status == "401"){
      ctx.status = 200
      ctx.body = util.fail(util.CODE.AUTH_ERROR,'Token认证失败')
    }else{
      throw err
    }
  })
})

app.use(koajwt({secret:'imooc'}).unless({
  path:[/^\/users\/login/]
}))

// routes
app.use(index.routes(), index.allowedMethods())
app.use(users.routes(), users.allowedMethods())
app.use(menus.routes(), menus.allowedMethods())
app.use(role.routes(), menus.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
  // logger.error(err)
});

module.exports = app
