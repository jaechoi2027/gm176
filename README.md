# Untolling Visualizer

A p5.js audio visualizer for an ambient electronic music piece.

## View the Visualizer

After GitHub Pages is enabled, the visualizer will be available at:

`https://jaechoi2027.github.io/untolling-visualizer/`

Click anywhere on the canvas to start or pause the audio.

## Run Locally

1. Open the `untolling-visualizer` folder in VSCode.
2. Right-click `index.html` in the Explorer panel.
3. Select **"Open with Live Server"**.
4. The browser will open. **Click anywhere on the canvas** to start the audio (required by browser autoplay policy).
5. Click again to pause/resume.

## Publish with GitHub Pages

1. Push this repository to GitHub.
2. Open the repository on GitHub.
3. Go to **Settings > Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/ (root)` folder, then click **Save**.

## Notes

- p5.js v1.9.0 and p5.sound are loaded from CDN — an internet connection is required.
- Audio will not play if you open `index.html` directly as a file (`file://`) due to browser security restrictions.
