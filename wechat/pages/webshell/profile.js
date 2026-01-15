const app = getApp();

Page({
  data: {
    token: '',
    openid: '',
    expiresIn: '',
    returnUrl: '',
    nickName: '',
    avatarUrl: '/images/default-avatar.png',
    loading: false
  },

  onLoad(options) {
    console.log('[profile] 页面加载', options);
    this.setData({
      token: options.token || '',
      openid: options.openid || '',
      expiresIn: options.expiresIn || '',
      returnUrl: decodeURIComponent(options.returnUrl || '')
    });
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    console.log('[profile] 选择头像:', avatarUrl);
    this.setData({ avatarUrl });
  },

  onNicknameInput(e) {
    this.setData({ nickName: e.detail.value });
  },

  onSubmit() {
    const { nickName, avatarUrl, token, openid, expiresIn } = this.data;

    if (!nickName || nickName.trim() === '') {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return;
    }

    this.setData({ loading: true });

    // 保存用户信息到本地
    app.saveUserInfo(token, openid, {
      expiresIn,
      nickName: nickName.trim(),
      avatarUrl
    });

    console.log('[profile] 资料已保存，返回主页');

    // 返回主页
    wx.redirectTo({
      url: '/pages/webshell/webshell'
    });
  }
});
