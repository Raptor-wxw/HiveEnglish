// miniprogram/pages/home/home.js
const db = wx.cloud.database()
const app = getApp()
var that
Page({
  /**
   * 页面的初始数据
   */
  data: {
    pullData: {},
    searchText: "",
    signedNum: 0,
    newWordsNum: 0,
    oldWordsNum: 0,
    unstudyWordsNum: 0,
    bookInfo:{},
    progressType: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // this.dataPull()
    if(app.globalData.openId)
      db.collection('userInfo').where({
        _id: app.globalData.openId
      })
      .get({
        success: function(res) {
          registerDay = res.data[0].registerDay
          nowDay = new Date()
          console.log(registerDay - nowDay)
          that.setData({
            signedNum : registerDay - nowDay
          })
        }
      })
    else this.unLoginStatus()
  },

  dataPull: function(){
    var bookInfo = {}
    var that = this
    console.log(app.globalData.openId)
    db.collection('userLearned').where({
      userId: app.globalData.openId
    })
    .get({
      success: function(res) {
        console.log(res.data)
        bookInfo.studiedNum = res.data[0].learnedSequence
        db.collection('Booklist').where({
          id: res.data[0].bookId
        })
        .get({
          success: function(res) {
            bookInfo.name = res.data[0].title
            bookInfo.totalNum = res.data[0].wordNum
            bookInfo.percentage = ((bookInfo.studiedNum / bookInfo.totalNum) * 100).toFixed(2)
            console.log(bookInfo)
            that.setData({
              bookInfo: bookInfo
            })
          }
        })
        console.log(res.data[0])
        that.setData({
          pullData: res.data[0],
          newWordsNum: res.data[0].newWord.length,
          oldWordsNum: res.data[0].reviewWord.length,
          unstudyWordsNum: res.data[0].newWord.length + res.data[0].reviewWord.length
        })
      }
    })
  },

  setTaskInfo: function(){
    var newWordsProgress = wx.getStorageSync('newWordsProgress')
    var oldWordsProgress = wx.getStorageSync('oldWordsProgress')
    var newWordsNum = newWordsProgress.totalNum
    var oldWordsNum = oldWordsProgress.totalNum
    var newWordsUnstudyNum = newWordsProgress.unstudyWords.length + newWordsProgress.studingWords.length  
    var oldWordsUnstudyNum =  oldWordsProgress.studingWords.length + oldWordsProgress.unstudyWords.length
    var unstudyWordsNum = newWordsUnstudyNum + oldWordsUnstudyNum
    var complete=false;
    if(newWordsProgress.complete&&oldWordsProgress.complete){
      complete=true;
    }
    that.setData({
      newWordsNum: newWordsNum,
      oldWordsNum: oldWordsNum,
      unstudyWordsNum: unstudyWordsNum,
      complete: complete
    })
  },

  setSignedNum: function(){
    var signedNum = 12
    that.setData({
      signedNum : signedNum
    })
  },

  searchInput: function(e){
    this.setData({
      searchText: e.detail.value
    })
  },

  search: function(){
    console.log(this.data.searchText)
    this.setData({
      searchText: "sssss"
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
    var that = this
    console.log(app.globalData.openId)
    if(app.globalData.openId){
      db.collection('userInfo').where({
        _id: app.globalData.openId
      })
      .get({
        success: function(res) {
          var registerDay = res.data[0].registerDay
          var nowDay = new Date()
          var day = parseInt((Date.parse(nowDay)-Date.parse(registerDay))/ (1000 * 60 * 60 * 24))+1;
          that.setData({
            signedNum : day
          })
        }
      })
      this.dataPull()
    }else this.unLoginStatus()
    // this.setTaskInfo()
    // this.setSignedNum()
    // this.setBookInfo()
  },

  startMain: function() {
    // if(!this.loginTest()) return;
    var that = this
    wx.navigateTo({
      url: '../main/main',
      success: function(res) {
        // 通过eventChannel向被打开页面传送数据
        res.eventChannel.emit('acceptDataFromOpenerPage', that.data.pullData)
      }
    })
  },

  toCalendarPage: function(){
    wx.navigateTo({
      url: '../calendar/calendar',
    })
  },

  toDictionary: function(e){
    var that = this
    wx.navigateTo({
      url: '../dictionary/dictionary?type='+e.currentTarget.dataset.type,
      success: function(res) {
        // 通过eventChannel向被打开页面传送数据
        res.eventChannel.emit('acceptDataFromOpenerPage', that.data.pullData)
      }
    })
  },
  
  toPhotoTrans: function(){
    if(!this.loginTest()) return;
  },

  toVsFriends: function(){
    if(!this.loginTest()) return;
    wx.navigateTo({
      url: '../fightHome/fightHome',
    })
  },

  toWordGame: function(){
    if(!this.loginTest()) return;
    wx.navigateTo({
      url: '../game/game',
    })
  },
  
  loginTest: function(){
    if(!app.globalData.openId){   //未登录跳转登录
      wx.showToast({
         title: '请授权登录！',
         icon: 'none',
         duration: 1500,
         success: function () {
         setTimeout(function () { // 等待1.5秒后跳转到userCenter
         wx.reLaunch({
         url: '../userCenter/userCenter',
            })
          }, 1500);
         }
      })
      return false
    }
    return true
  },

  unLoginStatus: function(){
    var that = this
    var bookInfo = {}
    bookInfo.name = "六级真题核心词（图片记忆）"
    bookInfo.percentage = "0.00"
    bookInfo.studiedNum = 0
    bookInfo.totalNum = 1228
    db.collection('userLearned').doc('3f1caf5060b0b45101f1404a0ed9734d').get({
      success: function(res) {
        if(wx.getStorageSync('myWordList')){
          that.setData({
            wordSequence: wx.getStorageSync('wordSequence'),
            oldWordsNum: wx.getStorageSync('oldWordsList').length,
            newWordsNum: wx.getStorageSync('newWordsList').length,
            unstudyWordsNum: wx.getStorageSync('newWordsList').length,
            bookInfo: bookInfo
          })
        }else that.setData({
          pullData: res.data,
          newWordsNum: res.data.newWord.length,
          oldWordsNum: res.data.reviewWord.length,
          unstudyWordsNum: res.data.newWord.length + res.data.reviewWord.length,
          bookInfo: bookInfo
        })
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

  },
})