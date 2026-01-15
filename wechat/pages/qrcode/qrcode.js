Page({
  data: {
    url: '',
    copied: false
  },

  onLoad(options) {
    if (options.url) {
      const url = decodeURIComponent(options.url);
      this.setData({ url });
      // 自动复制到剪贴板
      this.autoCopy(url);
    }
  },

  autoCopy(url) {
    wx.setClipboardData({
      data: url,
      success: () => {
        this.setData({ copied: true });
        wx.showToast({ title: '链接已复制', icon: 'success' });
      },
      fail: () => {
        console.log('[qrcode] 自动复制失败');
      }
    });
  },

  copyUrl() {
    if (!this.data.url) return;

    wx.setClipboardData({
      data: this.data.url,
      success: () => {
        this.setData({ copied: true });
        wx.showToast({ title: '复制成功', icon: 'success' });
      },
      fail: () => {
        wx.showToast({ title: '复制失败', icon: 'none' });
      }
    });
  },

  goBack() {
    wx.navigateBack({ delta: 1 });
  }
});
