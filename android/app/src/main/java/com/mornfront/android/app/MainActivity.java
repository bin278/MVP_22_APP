package com.mornfront.android.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.KeyEvent;
import android.webkit.WebSettings;
import android.webkit.WebView;
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

        // 拦截微信授权链接,使用外部浏览器打开
        setupWebViewClient();
    }

    private void setupWebViewClient() {
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setWebViewClient(new android.webkit.WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, String url) {
                    Log.d(TAG, "Loading URL: " + url);

                    // 检测微信授权链接 - 直接用浏览器打开
                    // 浏览器会自动提示"在微信中打开"
                    if (url.contains("open.weixin.qq.com")) {
                        Log.d(TAG, "WeChat OAuth URL detected, opening in browser");
                        try {
                            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                            startActivity(intent);
                            return true;
                        } catch (Exception e) {
                            Log.e(TAG, "Failed to open browser", e);
                            return false;
                        }
                    }

                    return super.shouldOverrideUrlLoading(view, url);
                }
            });
        }
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
