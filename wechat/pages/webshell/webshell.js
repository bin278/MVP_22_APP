const app = getApp();
const config = require('../../appConfig.js');

Page({
  data: {
    webUrl: ''
  },

  onLoad(options) {
    console.log('[webshell] 页面加载');
    this.buildWebUrl();
  },

  onShow() {
    console.log('[webshell] 页面显示');
    this.buildWebUrl();
  },

  buildWebUrl() {
    const baseUrl = config.general.initialUrl;
    const token = app.globalData.token;
    const openid = app.globalData.openid;
    const userInfo = app.globalData.userInfo;

    if (!baseUrl) {
      wx.showToast({
        title: '配置错误：未设置网页地址',
        icon: 'none'
      });
      return;
    }

    let url = baseUrl;

    // 如果已登录，附加登录信息到 URL
    if (token && openid) {
      const params = new URLSearchParams();
      params.append('token', token);
      params.append('openid', openid);

      if (userInfo) {
        if (userInfo.expiresIn) params.append('expiresIn', userInfo.expiresIn);
        if (userInfo.nickName) params.append('mpNickName', encodeURIComponent(userInfo.nickName));
        if (userInfo.avatarUrl) params.append('mpAvatarUrl', encodeURIComponent(userInfo.avatarUrl));
      }

      const separator = url.includes('?') ? '&' : '?';
      url = url + separator + params.toString();
    }

    console.log('[webshell] 加载网页:', url);
    this.setData({ webUrl: url });
  },

  handleMessage(e) {
    console.log('[webshell] 收到消息:', e.detail.data);
    const data = e.detail.data[0];

    if (data && data.type === 'REQUEST_WX_LOGIN') {
      const returnUrl = data.returnUrl || config.general.initialUrl;
      wx.navigateTo({
        url: `/pages/webshell/login?returnUrl=${encodeURIComponent(returnUrl)}`
      });
    }
  },

  handleError(e) {
    console.error('[webshell] 加载失败:', e.detail);
    wx.showToast({
      title: '网页加载失败',
      icon: 'none'
    });
  }
});
