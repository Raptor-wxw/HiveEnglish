import $ from './../../../../utils/Tool'
const STORAGE_KEY = 'ADD-MYAPP'

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 提示文字
    text: {
      type: String,
      value: '点击「添加小程序」，分享给好友一起吧~'
    },
    // 多少秒后关闭
    duration: {
      type: Number,
      value: 6
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    SHOW_TOP: false,
    SHOW_MODAL: false,
    // top: $.store.get('CustomBar') - 10
    top: 0
  },

  ready: function() {
    // 判断是否已经显示过
    const cache = wx.getStorageSync(STORAGE_KEY)
    if (cache) return
    // 没显示过，则进行展示
    this.setData({
      SHOW_TOP: true
    })
    // 关闭时间
    setTimeout(() => {
      this.setData({
        SHOW_TOP: false
      })
    }, this.data.duration * 1000)
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 显示全屏添加说明
    showModal: function() {
      this.setData({
        SHOW_TOP: false,
        SHOW_MODAL: true
      })
    },

    okHandler: function() {
      this.setData({
        SHOW_MODAL: false
      })
      wx.setStorage({
        key: STORAGE_KEY,
        data: +new Date()
      })
    }
  }
})
