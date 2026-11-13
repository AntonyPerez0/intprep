package io.github.antonyperez0.intprep;

import android.content.pm.ActivityInfo;
import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Draw behind the status and navigation bars on every Android version, as Android 15 and
        // later always do. The page keeps clear of them with env(safe-area-inset-*); where the
        // WebView is too old to report those (before 140), Capacitor's SystemBars plugin pads it.
        EdgeToEdge.enable(this);

        // Phones stay upright; tablets (res/values-sw600dp/bools.xml) turn freely.
        if (getResources().getBoolean(R.bool.portrait_only)) {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
        }
    }
}
