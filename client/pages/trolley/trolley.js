const qcloud = require('../../vendor/wafer2-client-sdk/index')
const config = require('../../config')
const app = getApp()

// pages/trolley/trolley.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,
    lcoationAuthType: app.data.locationAuthType,
    trolleyList: [], // 购物车商品列表
    trolleyCheckMap: [], // 购物车中选中的id哈希表
    trolleyAccount: 0, // 购物车结算总价
    isTrolleyEdit: false, // 购物车是否处于编辑状态
    isTrolleyTotalCheck: false, // 购物车中商品是否全选
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  onTapLogin: function () {
    app.login({
      success: ({ userInfo }) => {
        this.setData({
          userInfo,
          locationAuthType: app.data.locationAuthType
        })

        this.getTrolley()
      },
      error: () => {
        this.setData({
          locationAuthType: app.data.locationAuthType
        })
      }
    })
  },

  getTrolley(){
    wx.showLoading({
      title: '刷新购物车数据',
    })

    qcloud.request({
      url: config.service.trolleyList,
      login: true,
      success: result => {
        wx.hideLoading()

        let data = result.data
        
        if (!data.code){
          this.setData({
            trolleyList:data.data
          })
        } else {
          wx.showToast({
            icon:'none',
            title: '数据刷新失败',
          })
        }
      },
      fail: () =>{
        wx.hideLoading()

        wx.showToast({
          icon: 'none',
          title: '数据刷新失败',
        })
      }
    })
  },

  onTapCheckSingle(event){
    let checkId = event.currentTarget.dataset.id
    let trolleyCheckMap = this.data.trolleyCheckMap
    let trolleyList = this.data.trolleyList
    let isTrolleyTotalCheck = this.data.isTrolleyTotalCheck
    let trolleyAccount = this.data.trolleyAccount 
    let numTotalProduct
    let numCheckedProduct = 0

    trolleyCheckMap[checkId] = !trolleyCheckMap[checkId]

    numTotalProduct = trolleyList.length
    trolleyCheckMap.forEach(checked => {
      numCheckedProduct = checked ? numCheckedProduct + 1 : numCheckedProduct
    })

    isTrolleyTotalCheck = (numTotalProduct === numCheckedProduct) ? true : false

    trolleyAccount = this.calAccount(trolleyList, trolleyCheckMap)

    this.setData({
      trolleyCheckMap,
      isTrolleyTotalCheck,
      trolleyAccount
    })
  },

  onTapCheckTotal(event){
    let trolleyCheckMap = this.data.trolleyCheckMap
    let trolleyList = this.data.trolleyList
    let isTrolleyTotalCheck = this.data.isTrolleyTotalCheck
    let trolleyAccount = this.data.trolleyAccount 

    isTrolleyTotalCheck = !isTrolleyTotalCheck

    trolleyList.forEach(product => {
      trolleyCheckMap[product.id] = isTrolleyTotalCheck
    })

    trolleyAccount = this.calAccount(trolleyList, trolleyCheckMap)

    this.setData({
      isTrolleyTotalCheck,
      trolleyCheckMap,
      trolleyAccount
    })
  },

  calAccount(trolleyList, trolleyCheckMap){
    let account = 0
    trolleyList.forEach(product => {
      account = trolleyCheckMap[product.id] ? account + product.price * product.count : account
    })

    return account
  },

  onTapEditTrolley(){
    let isTrolleyEdit = this.data.isTrolleyEdit

    if (isTrolleyEdit) {
      this.udpateTrolley()
    } else {
        this.setData({
          isTrolleyEdit: !isTrolleyEdit
        })
      }
  },

  adjustTrolleyProductCount(event){
    let trolleyCheckMap = this.data.trolleyCheckMap
    let trolleyList = this.data.trolleyList
    let dataset = event.currentTarget.dataset
    let adjustType = dataset.adjustType
    let productId = dataset.id
    let product
    let index

    for (index = 0; index < trolleyList.length; index++){
      if (productId === trolleyList[index].id){
        product = trolleyList[index]
        break
      }
    }

    if (product) {
      if (adjustType === 'add'){
        product.count++
      } else {
        if (product.count <=1){
          // 商品数量不超过1，点击减号相当于删除
          delete trolleyCheckMap[productId]
          trolleyList.splice(index,1)
        } else {
          product.count--
        }
      }
    }

    let trolleyAccount = this.calAccount(trolleyList, trolleyCheckMap)

    if (!trolleyList.length) {
      this.updateTrolley()
    }

    this.setData({
      trolleyAccount,
      trlleyList,
      trolleyCheckMap
    })
  },

  updateTrolley(){
    wx.showLoading({
      title: '更新购物车数据',
    })

    let trolleyList = this.data.trlleyList

    qcloud.request({
      url: config.serveice.updateTrolley,
      method: 'POST',
      login: true,
      data:{
        list: trolleyList
      },
      success: result =>{
        wx.hideLoading()

        let data = result.data

        if (!data.code){
          this.setData({
            isTrolleyEdit:false
          })
        } else {
          wx.showToast({
            icon:'none',
            title: '更新购物车失败',
          })
        }
      },
      fail: ()=>{
        wx.hideLoading()

        wx.showToast({
          icon: 'none',
          title: '更新购物车失败',
        })
      }
    })
  },

  onTapPay(){
    if (!this.data.trolleyAccount) return

    wx.showLoading({
      title: '结算中...',
    })

    let trolleyCheckMap = this.data.trolleyCheckMap
    let trolleyList = this.data.trlleyList

    let needToPayProductList = trolleyList.filter(product => {
      return !!trolleyCheckMap[product.id]
    })

    qcloud.request({
      url:config.service.addOrder,
      login: true,
      method: 'POST',
      data: {
        list: needToPayProductList
      },
      success: result => {
        wx.hideLoading()

        let data = result.data

        if (!data.code){
          wx.showToast({
            title: '结算成功',
          })

          this.getTrolley()
        } else {
          wx.showToast({
            icon: 'none',
            title: '结算失败',
          })
        }
      },
    fail: () => {
      wx.hideLoading()
      
      wx.showToast({
        icon: 'none',
        title: '结算失败',
      })
    }
  })
},

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.setData({
      locationAuthType: app.data.locationAuthType
    })
    app.checkSession({
      success: ({ userInfo }) => {
        this.setData({
          userInfo
        })

        this.getTrolley()
      }
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})