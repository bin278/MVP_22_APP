package com.mornfront.app;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 让内容延伸到系统栏（状态栏和导航栏）区域
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    }
}
