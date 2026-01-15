const config = require('./appConfig.js');

App({
  globalData: {
    config: config,
    userInfo: null,
    token: null,
    openid: null
  },

  onLaunch() {
    console.log('[App] 小程序启动');
    console.log('[App] 配置:', this.globalData.config);

    // 加载用户信息
    this.loadUserInfo();
  },

  loadUserInfo() {
    try {
      const token = wx.getStorageSync('auth_token');
      const openid = wx.getStorageSync('openid');
      const userInfo = wx.getStorageSync('userInfo');

      if (token) {
        this.globalData.token = token;
        this.globalData.openid = openid;
        this.globalData.userInfo = userInfo;
        console.log('[App] 已加载用户信息');
      }
    } catch (e) {
      console.error('[App] 加载用户信息失败:', e);
    }
  },

  saveUserInfo(token, openid, userInfo) {
    try {
      wx.setStorageSync('auth_token', token);
      wx.setStorageSync('openid', openid);
      if (userInfo) {
        wx.setStorageSync('userInfo', userInfo);
      }

      this.globalData.token = token;
      this.globalData.openid = openid;
      this.globalData.userInfo = userInfo;

      console.log('[App] 用户信息已保存');
    } catch (e) {
      console.error('[App] 保存用户信息失败:', e);
    }
  },

  clearUserInfo() {
    try {
      wx.removeStorageSync('auth_token');
      wx.removeStorageSync('openid');
      wx.removeStorageSync('userInfo');

      this.globalData.token = null;
      this.globalData.openid = null;
      this.globalData.userInfo = null;

      console.log('[App] 用户信息已清除');
    } catch (e) {
      console.error('[App] 清除用户信息失败:', e);
    }
  }
});
