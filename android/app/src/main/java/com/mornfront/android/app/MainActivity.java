package com.mornfront.android.app;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.KeyEvent;
import android.webkit.WebSettings;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 让内容延伸到系统栏（状态栏和导航栏）区域
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        // 延迟设置 UserAgent，确保 WebView 完全初始化
        new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
            @Override
            public void run() {
                setUserAgent();
            }
        }, 500);
    }

    private void setUserAgent() {
        if (getBridge() != null && getBridge().getWebView() != null) {
            try {
                WebSettings settings = getBridge().getWebView().getSettings();
                String originalUserAgent = settings.getUserAgentString();
                String newUserAgent = originalUserAgent + " CapacitorApp/com.mornfront.android.app";
                settings.setUserAgentString(newUserAgent);
                Log.d(TAG, "UserAgent set successfully: " + newUserAgent);
            } catch (Exception e) {
                Log.e(TAG, "Failed to set UserAgent", e);
            }
        } else {
            Log.w(TAG, "Bridge or WebView is null, cannot set UserAgent");
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
