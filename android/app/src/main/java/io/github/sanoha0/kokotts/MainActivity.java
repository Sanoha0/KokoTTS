package io.github.sanoha0.kokotts;

import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.webkit.WebViewAssetLoader;

import java.io.OutputStream;
import java.util.Locale;

public class MainActivity extends Activity {
    private static final String APP_URL =
            "https://appassets.androidplatform.net/assets/kokotts/index.html";
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);

        WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(
                    @NonNull WebView view,
                    @NonNull WebResourceRequest request
            ) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(
                    @NonNull WebView view,
                    @NonNull WebResourceRequest request
            ) {
                Uri uri = request.getUrl();
                if ("appassets.androidplatform.net".equals(uri.getHost())) {
                    return false;
                }
                startActivity(new Intent(Intent.ACTION_VIEW, uri));
                return true;
            }
        });
        webView.setWebChromeClient(new WebChromeClient());
        webView.addJavascriptInterface(new AndroidDownloads(), "AndroidDownloads");
        webView.loadUrl(APP_URL);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.removeJavascriptInterface("AndroidDownloads");
            webView.destroy();
        }
        super.onDestroy();
    }

    public final class AndroidDownloads {
        @JavascriptInterface
        public void saveBase64(String requestedName, String requestedMime, String dataUrl) {
            new Thread(() -> saveDownload(requestedName, requestedMime, dataUrl)).start();
        }

        private void saveDownload(String requestedName, String requestedMime, String dataUrl) {
            String mime = sanitizeMime(requestedMime);
            String name = sanitizeName(requestedName, mime);
            Uri item = null;
            try {
                int comma = dataUrl.indexOf(',');
                if (comma < 0) {
                    throw new IllegalArgumentException("Invalid audio data");
                }
                byte[] bytes = Base64.decode(dataUrl.substring(comma + 1), Base64.DEFAULT);

                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, name);
                values.put(MediaStore.Downloads.MIME_TYPE, mime);
                values.put(
                        MediaStore.Downloads.RELATIVE_PATH,
                        Environment.DIRECTORY_DOWNLOADS + "/KokoTTS"
                );
                values.put(MediaStore.Downloads.IS_PENDING, 1);

                item = getContentResolver().insert(
                        MediaStore.Downloads.EXTERNAL_CONTENT_URI,
                        values
                );
                if (item == null) {
                    throw new IllegalStateException("Android could not create the download");
                }

                try (OutputStream stream = getContentResolver().openOutputStream(item)) {
                    if (stream == null) {
                        throw new IllegalStateException("Android could not open the download");
                    }
                    stream.write(bytes);
                }

                ContentValues completed = new ContentValues();
                completed.put(MediaStore.Downloads.IS_PENDING, 0);
                getContentResolver().update(item, completed, null, null);
                showToast(name + " saved to Downloads/KokoTTS");
            } catch (Exception error) {
                if (item != null) {
                    getContentResolver().delete(item, null, null);
                }
                showToast("Could not save audio: " + error.getMessage());
            }
        }

        private String sanitizeMime(String requestedMime) {
            return "audio/mpeg".equals(requestedMime) ? "audio/mpeg" : "audio/wav";
        }

        private String sanitizeName(String requestedName, String mime) {
            String extension = "audio/mpeg".equals(mime) ? ".mp3" : ".wav";
            String safe = requestedName == null ? "kokotts" : requestedName
                    .replaceAll("[^a-zA-Z0-9._-]", "_")
                    .replaceAll("^[.]+", "");
            if (safe.isEmpty()) {
                safe = "kokotts";
            }
            if (!safe.toLowerCase(Locale.ROOT).endsWith(extension)) {
                safe += extension;
            }
            return safe;
        }

        private void showToast(String message) {
            runOnUiThread(() -> Toast.makeText(
                    MainActivity.this,
                    message,
                    Toast.LENGTH_LONG
            ).show());
        }
    }
}
