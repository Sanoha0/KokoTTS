# Keep the JavaScript download bridge available in release builds.
-keepclassmembers class io.github.sanoha0.kokotts.MainActivity$AndroidDownloads {
    @android.webkit.JavascriptInterface <methods>;
}
