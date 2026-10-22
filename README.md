# KokoTTS

Free, private, browser-based text to speech powered by Kokoro-82M. Paste text, select one of 28 female or male American/British English voices, listen on the page, and download MP3 or WAV.

## Features

- No account, API key, subscription, inference server, or generation fees.
- Local WebAssembly speech synthesis and local MP3/WAV encoding.
- Voice gender, accent, and 0.5×–2× speed controls.
- Plain-text/Markdown import, progress, cancellation, playback, and waveform.
<<<<<<< HEAD
=======
- Karaoke-style word highlighting while the generated audio plays (approximate word timing).
>>>>>>> 544063aeada6b406102f5d474a0896e08148042d
- A 20,000-character per-run limit and safe chunking for browser memory.

## Run

```sh
npm ci
npm run dev
```

For production, run `npm run build` and host `dist/` on any HTTPS static host. The relative base path supports GitHub project Pages.

## GitHub Pages

In **Settings → Pages**, select **GitHub Actions**. The included workflow builds and deploys after changes to `main`.

<<<<<<< HEAD
## Privacy and limits

The first generation downloads roughly 90 MB of model weights plus runtime and voice files from Hugging Face/CDN services, which receive ordinary request metadata. Input text and generated audio stay in browser memory and are never sent to this website's server. Browser caching is best effort. This release supports English voices and uses CPU/WebAssembly for compatibility; performance depends on the device.
=======

## Mobile installation

KokoTTS is responsive and installable from the GitHub Pages site. On a supported mobile browser, tap **Install app** or use the browser's **Add to Home Screen** command.

GitHub Actions also builds an Android APK. Open the latest successful **Build Android APK** run, download the \`KokoTTS-Android-debug\` artifact, unzip it, and install \`app-debug.apk\`. Android may ask you to allow installs from the browser or file manager you used.

The APK bundles the web app in an Android WebView. Generated MP3 and WAV files save to \`Downloads/KokoTTS\`. The current build is debug-signed; if Android rejects an update from a later build, uninstall the older KokoTTS APK first.

## Privacy and limits

The first generation downloads model weights plus runtime and voice files from Hugging Face/CDN services, which receive ordinary request metadata. The GPU model is larger than the CPU fallback. Input text and generated audio stay in browser memory and are never sent to this website's server. Browser caching is best effort. This release supports English voices and uses GPU acceleration where available, with a CPU/WebAssembly fallback; performance depends on the device.
>>>>>>> 544063aeada6b406102f5d474a0896e08148042d

## Verification

The implementation was checked with real Heart (female) and George (male) synthesis, browser playback, MP3 decoding, WAV export, a 390px mobile viewport, and unit tests for audio/chunking. Run `npm test` for the local tests.

## License

Application code is MIT. Kokoro, its model, Transformers.js, phonemizer/eSpeak NG, and LAME.js retain their respective licenses. See `public/THIRD_PARTY_NOTICES.txt`.
<<<<<<< HEAD
# Mobile installation

KokoTTS works on phones and tablets from the same GitHub Pages site. In a supported mobile browser, use the **Install app** button or the browser's **Add to Home Screen** command to install the free Progressive Web App.

An Android APK is also built automatically by GitHub Actions. Open the latest successful **Build Android APK** workflow run, download the `KokoTTS-Android-debug` artifact, unzip it, and install `app-debug.apk`. Android may ask you to allow installs from the browser or file manager you used.

The APK contains the compiled website and runs it in a secure Android WebView. Generated MP3 and WAV files are saved under `Downloads/KokoTTS`. The current downloadable build is debug-signed, so uninstall an older build first if Android refuses an update from a newly generated artifact.

To build it locally, build the website, copy `dist` into `android/app/src/main/assets/kokotts`, then run `gradle :app:assembleDebug` from the `android` directory with Java 17 and Gradle 8.9.
=======
>>>>>>> 544063aeada6b406102f5d474a0896e08148042d

