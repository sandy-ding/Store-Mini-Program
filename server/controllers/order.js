const DB = require('../utils/db.js')

module.exports = {
  add: async ctx => {
    let user = ctx.state.$wxInfo.userinfo.openId
    let productList = ctx.request.body.list || []
    let isInstantBuy = !!ctx.request.body.isInstantBuy 
  
    let order = await DB.query('insert into order_user(user) values (?)', [user])

    let orderId = order.inserId
    let sql = 'INSERT INTO order_product (order_id, product_id, count) VALUES '

    let param = []
    let query = []

    let needToDelQuery = []
    let needToDelIds = []

    productList.forEach(product => {
    query.push('(?, ?, ?)')

    param.push(orderId)
    param.push(product.id)
    param.push(product.count || 1)

    needToDelQuery.push('?')
    needToDelIds.push(product.id)
  })

  await DB.query(sql + query.join(', '), param)

  if (!isInstantBuy){
    await DB.query('DELETE FROM trolley_user WHERE trolley_user.id IN (' + needToDelQuery.join(', ') + ') AND trolley_user.user = ?', [...needToDelIds,user])
  }

  ctx.state.data = {}
  },

  list: async ctx => {
    let user = ctx.state.$wxInfo.userinfo.openId

    let list = await DB.query('SELECT order_user.id AS `id`, order_user.user AS `user`, order_user.create_time AS `create_time`, order_product.product_id AS `product_id`, order_product.count AS `count`, product.name AS `name`, product.image AS `image`, product.price AS `price` FROM order_user LEFT JOIN order_product ON order_user.id = order_product.order_id LEFT JOIN product ON order_product.product_id = product.id WHERE order_user.user = ? ORDER BY order_product.order_id', [user])
    // 将数据库返回的数据组装成页面呈现所需的格式
    let ret = []
    let cacheMap = {}
    let block = []
    let id = 0

    list.forEach(order => {
      if (!cacheMap[order.id]) {
        block = []
        ret.push({
          id: ++id,
          list: block
        })

        cacheMap[order.id] = true
      }

       block.push(order)
    })

     ctx.state.data = ret
  },
} 