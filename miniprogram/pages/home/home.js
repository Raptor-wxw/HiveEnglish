// miniprogram/pages/home/home.js
var myMethod = require('../../utils/myMethod.js');
var CryptoJS = require('../../utils/crypto-js.js');
const API = "https://dict.youdao.com/dictvoice?audio="
const db = wx.cloud.database()
const app = getApp()
var that
Page({
	/**
	 * 页面的初始数据
	 */
	data: {
		ColorList: app.globalData.ColorList,
		color: 'red',
		pullData: {},
		searchText: "",
		signedNum: 0,
		newWordsNum: 0,
		oldWordsNum: 0,
		unstudyWordsNum: 0,
		bookInfo: {},
		progressType: 0,
		hasReasult: false, // 是否有单词翻译
		searchReasult: {
			wordHead: "tset", // 输入单词
			tranCn: "测试", // 翻译结果
			fromspeech: "test", // 翻以前语音
			tospeech: "test" // 翻译后语音
		}
	},
	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (options) {
		let that = this;
		console.log(app.globalData.openId)

		setTimeout(function () { // 等待1.5秒登录
			if (!app.globalData.openId) that.unLoginStatus()
			else that.dataPull()
		}, 1500);
	},

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow: function () {
		if (app.globalData.openId) this.dataPull()
	},

	showModal(e) {
		this.translate(this.data.query);
		this.setData({
			modalName: e.currentTarget.dataset.target
		})
	},
	hideModal(e) {
		this.setData({
			modalName: null
		})
	},
	// 获取要翻译的单词
	bindInput: function (e) {
		this.setData({
			query: e.detail.value
		})
	},

	translate: function (e) {
		var result = {
			toWord: []
		}
		var query = e;
		var that = this;
		console.log(query)
		var appKey = '34a69e1ca7b7274f';
		var key = 'cNh4xArEls6qsF1FnqlgDpbaFNCxT4WC';
		var salt = (new Date).getTime();
		var curtime = Math.round(new Date().getTime() / 1000);
		var from = 'auto';
		var to = 'auto';
		var str1 = appKey + this.truncate(query) + salt + curtime + key;
		var vocabId = '您的用户词表ID';
		// var sign = sha256.sha256_digest(str1)
		var sign = CryptoJS.SHA256(str1).toString(CryptoJS.enc.Hex);
		wx.request({
			url: 'https://openapi.youdao.com/api',
			data: {
				q: query,
				appKey: appKey,
				salt: salt,
				from: from,
				to: to,
				sign: sign,
				signType: "v3",
				curtime: curtime,
				vocabId: vocabId,
			},
			success: res => {
				result.fromWord = query
				try {
					result.toWord = res.data.basic.explains
				} catch (err) {
					result.toWord.push(res.data.translation[0])
				}
				try {
					result.phonetic = res.data.basic.phonetic ? res.data.basic.phonetic : "暂无音标"
				} catch (err) {
					result.phonetic = "暂无音标"
				}
				result.type = res.data.l
				result.wordHead = res.data.query
				result.tranCn = res.data.translation[0]
				result.tospeech = res.data.tSpeakUrl
				result.fromspeech = res.data.speakUrl
				that.setData({
					hasReasult: true,
					searchReasult: result
				})
			},
			fail: res => {
				console.log('fail:', res)
			}
		})
		console.log(result)
	},

	// 翻译接口配套加密
	truncate: function (q) {
		var len = q.length;
		if (len <= 20) return q;
		return q.substring(0, 10) + len + q.substring(len - 10, len);
	},

	// 朗读
	pronounce: function (e) {
		const innerAudioContext = wx.createInnerAudioContext()
		innerAudioContext.autoplay = true
		if (this.data.searchReasult.type == "en2zh-CHS") { // 含英文
			innerAudioContext.src = API + this.data.searchReasult.fromWord + "&type=1"
		} else wx.showToast({
			title: '暂不支持非英文',
			icon: 'none',
			duration: 1500,
		})
		innerAudioContext.onPlay(() => {
			console.log('开始播放')
		})
		innerAudioContext.onError((res) => {
			console.log(res.errMsg)
			console.log(res.errCode)
		})
	},

	dataPull: function () {
		var bookInfo = {}
		var that = this
		console.log(app.globalData.openId)
		db.collection('userLearned').where({
				userId: app.globalData.openId
			})
			.get({
				success: function (res) {
					console.log(res.data)
					bookInfo.studiedNum = res.data[0].learnedSequence
					db.collection('Booklist').where({
							id: res.data[0].bookId
						})
						.get({
							success: function (res) {
								bookInfo.cover = res.data[0].cover
								bookInfo.name = res.data[0].title
								bookInfo.totalNum = res.data[0].wordNum
								bookInfo.percentage = ((bookInfo.studiedNum / bookInfo
									.totalNum) * 100).toFixed(2)
								console.log(bookInfo)
								that.setData({
									bookInfo: bookInfo
								})
							}
						})
					that.setData({
						pullData: res.data[0],
						newWordsNum: res.data[0].newWord.length,
						oldWordsNum: res.data[0].reviewWord.length,
						unstudyWordsNum: res.data[0].newWord.length + res.data[0].reviewWord
							.length
					})
				}
			})
	},

	setTaskInfo: function () {
		var pushuserLearned = wx.getStorageSync('pushuserLearned')
		var newWordsNum = pushuserLearned.newWord
		var oldWordsNum = pushuserLearned.reviewWord
		var unstudyWordsNum = newWordsNum + oldWordsNum
		var complete = false;
		if (oldWordsNum == unstudyWordsNum) {
			complete = true;
		}
		that.setData({
			newWordsNum: newWordsNum,
			oldWordsNum: oldWordsNum,
			unstudyWordsNum: unstudyWordsNum,
			complete: complete
		})
	},

	searchInput: function (e) {
		this.setData({
			searchText: e.detail.value
		})
	},

	startMain: function () {
		// if(!this.loginTest()) return;
		var that = this
		console.log(that.data.pullData)
		wx.navigateTo({
			url: '../main/main',
			success: function (res) {
				// 通过eventChannel向被打开页面传送数据
				res.eventChannel.emit('acceptDataFromOpenerPage', that.data.pullData)
			}
		})
	},

	toCalendarPage: function () {
		wx.navigateTo({
			url: '../calendar/calendar',
		})
	},

	toDictionary: function (e) {
		var that = this
		wx.navigateTo({
			url: '../dictionary/dictionary?type=' + e.currentTarget.dataset.type,
			success: function (res) {
				// 通过eventChannel向被打开页面传送数据
				res.eventChannel.emit('acceptDataFromOpenerPage', that.data.pullData)
			}
		})
	},

	toPhotoTrans: function () {
		if (!this.loginTest()) return;
		else {
			wx.showToast({
				title: '暂未开放！',
				icon: 'none',
				duration: 1000
			})
		}
	},

	toVsFriends: function () {
		if (!this.loginTest()) return;
		wx.navigateTo({
			url: '../fightHome/fightHome',
		})
	},

	toWordGame: function () {
		if (!this.loginTest()) return;
		wx.navigateTo({
			url: '../game/game',
		})
	},

	loginTest: function () {
		if (!app.globalData.openId) { //未登录跳转登录
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

	unLoginStatus: function () {
		console.log("in")
		var that = this
		var bookInfo = {}
		bookInfo.cover = "https://nos.netease.com/ydschool-online/1496655382926CET6luan_1.jpg"
		bookInfo.percentage = "0.00"
		bookInfo.studiedNum = 0
		bookInfo.totalNum = 1228
		db.collection('userLearned').doc('3f1caf5060b0b45101f1404a0ed9734d').get({
			success: function (res) {
				if (wx.getStorageSync('myWordList')) {
					that.setData({
						wordSequence: wx.getStorageSync('wordSequence'),
						oldWordsNum: wx.getStorageSync('oldWordsList').length,
						newWordsNum: wx.getStorageSync('newWordsList').length,
						unstudyWordsNum: wx.getStorageSync('newWordsList').length,
						bookInfo: bookInfo
					})
				} else that.setData({
					pullData: res.data,
					newWordsNum: res.data.newWord.length,
					oldWordsNum: res.data.reviewWord.length,
					unstudyWordsNum: res.data.newWord.length + res.data.reviewWord
						.length,
					bookInfo: bookInfo
				})
			}
		})
	},

	/**
	 * 用户点击右上角分享
	 */
	onShareAppMessage: function () {

	},
})