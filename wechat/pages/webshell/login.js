const app = getApp();
const config = require('../../appConfig.js');

Page({
  data: {
    loading: false,
    returnUrl: ''
  },

  onLoad(options) {
    console.log('[login] 页面加载', options);
    this.setData({
      returnUrl: options.returnUrl || config.general.initialUrl
    });

    // 自动开始登录流程
    this.startLogin();
  },

  startLogin() {
    this.setData({ loading: true });

    wx.login({
      success: (res) => {
        if (res.code) {
          console.log('[login] 获取 code 成功:', res.code);
          this.checkUser(res.code);
        } else {
          console.error('[login] 获取 code 失败:', res.errMsg);
          this.showError('登录失败，请重试');
        }
      },
      fail: (err) => {
        console.error('[login] wx.login 失败:', err);
        this.showError('登录失败，请重试');
      }
    });
  },

  checkUser(code) {
    const apiUrl = config.general.initialUrl.replace(/\/$/, '') + '/api/wxlogin/check';

    console.log('[login] 调用 check API:', apiUrl);

    wx.request({
      url: apiUrl,
      method: 'POST',
      data: { code },
      header: { 'Content-Type': 'application/json' },
      success: (res) => {
        console.log('[login] check API 响应:', res);

        if (res.statusCode === 200 && res.data.success) {
          const { token, openid, expiresIn, hasProfile, userName, userAvatar } = res.data;

          if (hasProfile) {
            // 老用户，直接保存信息并返回
            app.saveUserInfo(token, openid, {
              expiresIn,
              nickName: userName,
              avatarUrl: userAvatar
            });
            this.navigateBack(token, openid, expiresIn, userName, userAvatar);
          } else {
            // 新用户，跳转到资料填写页面
            wx.redirectTo({
              url: `/pages/webshell/profile?token=${token}&openid=${openid}&expiresIn=${expiresIn}&returnUrl=${encodeURIComponent(this.data.returnUrl)}`
            });
          }
        } else {
          this.showError(res.data.message || '登录失败');
        }
      },
      fail: (err) => {
        console.error('[login] check API 请求失败:', err);
        this.showError('网络错误，请重试');
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  navigateBack(token, openid, expiresIn, nickName, avatarUrl) {
    const returnUrl = this.data.returnUrl;
    const params = new URLSearchParams();

    params.append('token', token);
    params.append('openid', openid);
    if (expiresIn) params.append('expiresIn', expiresIn);
    if (nickName) params.append('mpNickName', encodeURIComponent(nickName));
    if (avatarUrl) params.append('mpAvatarUrl', encodeURIComponent(avatarUrl));

    const separator = returnUrl.includes('?') ? '&' : '?';
    const finalUrl = returnUrl + separator + params.toString();

    console.log('[login] 登录成功，返回:', finalUrl);

    wx.redirectTo({
      url: `/pages/webshell/webshell`
    });
  },

  showError(message) {
    this.setData({ loading: false });
    wx.showModal({
      title: '登录失败',
      content: message,
      showCancel: false,
      confirmText: '重试',
      success: (res) => {
        if (res.confirm) {
          this.startLogin();
        }
      }
    });
  },

  onRetry() {
    this.startLogin();
  }
});
