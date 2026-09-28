# KokoTTS

Free, private, browser-based text to speech powered by Kokoro-82M. Paste text, select one of 28 female or male American/British English voices, listen on the page, and download MP3 or WAV.

## Features

- No account, API key, subscription, inference server, or generation fees.
- Local WebAssembly speech synthesis and local MP3/WAV encoding.
- Voice gender, accent, and 0.5×–2× speed controls.
- Plain-text/Markdown import, progress, cancellation, playback, and waveform.
- A 20,000-character per-run limit and safe chunking for browser memory.

## Run

```sh
npm ci
npm run dev
```

For production, run `npm run build` and host `dist/` on any HTTPS static host. The relative base path supports GitHub project Pages.

## GitHub Pages

In **Settings → Pages**, select **GitHub Actions**. The included workflow builds and deploys after changes to `main`.

## Privacy and limits

The first generation downloads roughly 90 MB of model weights plus runtime and voice files from Hugging Face/CDN services, which receive ordinary request metadata. Input text and generated audio stay in browser memory and are never sent to this website's server. Browser caching is best effort. This release supports English voices and uses CPU/WebAssembly for compatibility; performance depends on the device.

## Verification

The implementation was checked with real Heart (female) and George (male) synthesis, browser playback, MP3 decoding, WAV export, a 390px mobile viewport, and unit tests for audio/chunking. Run `npm test` for the local tests.

## License

Application code is MIT. Kokoro, its model, Transformers.js, phonemizer/eSpeak NG, and LAME.js retain their respective licenses. See `public/THIRD_PARTY_NOTICES.txt`.

