package com.mornfront.app;

import android.os.Bundle;
import android.view.KeyEvent;
import android.webkit.WebSettings;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 让内容延伸到系统栏（状态栏和导航栏）区域
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        // 设置 UserAgent 来标识这是 Capacitor APP
        setUserAgent();
    }

    private void setUserAgent() {
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebSettings settings = getBridge().getWebView().getSettings();
            String originalUserAgent = settings.getUserAgentString();
            String newUserAgent = originalUserAgent + " CapacitorApp/com.mornfront.app";
            settings.setUserAgentString(newUserAgent);
        }
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        // 处理返回键，让 WebView 可以返回上一页
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            // 如果 WebView 有历史记录，则返回上一页
            if (getBridge() != null && getBridge().getWebView() != null) {
                if (getBridge().getWebView().canGoBack()) {
                    getBridge().getWebView().goBack();
                    return true;
                }
            }
        }
        return super.onKeyDown(keyCode, event);
    }
}
