let song;
let fft;
let amplitude;
let particles = [];
let ripples = [];
let startTime;
let songDuration = 131;

// recording
let recorder;
let recordedChunks = [];
let isRecording = false;
let recorderReady = false;

const beatingPairs = [
  { freq: 187, beat: 2.685 },
  { freq: 431, beat: 2.516 },
  { freq: 546, beat: 4.915 },
  { freq: 677, beat: 2.097 }
];

function preload() {
  song = loadSound("Untolling.wav");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  angleMode(DEGREES);
  fft = new p5.FFT(0.95, 128);
  amplitude = new p5.Amplitude();
  background(220, 30, 6);

  for (let i = 0; i < 120; i++) {
    particles.push(new Particle(i));
  }

  startTime = millis();
}

function draw() {
  let spectrum = fft.analyze();
  let level = amplitude.getLevel();
  let elapsed = (millis() - startTime) / 1000;

  let progress = constrain(elapsed / songDuration, 0, 1);

  let trailAlpha = map(sin(progress * 180), 0, 1, 3, 15);
  let baseHue = (200 + progress * 160) % 360;
  let rotation = elapsed * (0.5 + progress * 1.5);

  background(baseHue, 30, 6, trailAlpha);

  for (let p of particles) {
    p.update(spectrum, elapsed, progress, level);
    p.show(baseHue);
  }

  translate(width / 2, height / 2);
  rotate(rotation);

  for (let i = ripples.length - 1; i >= 0; i--) {
    ripples[i].update();
    ripples[i].show(baseHue);
    if (ripples[i].isDone()) ripples.splice(i, 1);
  }

  for (let i = 0; i < beatingPairs.length; i++) {
    drawBeatingRing(beatingPairs[i], i, elapsed, progress, baseHue);
  }

  if (isRecording) {
    resetMatrix();
    noStroke();
    fill(0, 100, 100);
    circle(30, 30, 14);
    fill(0, 0, 100);
    textSize(12);
    textAlign(LEFT, CENTER);
    text("REC", 45, 30);
  }
}

function drawBeatingRing(pair, index, elapsed, progress, baseHue) {
  let energy = fft.getEnergy(pair.freq - 30, pair.freq + 30);
  let beatPulse = (sin(elapsed * pair.beat * 360) + 1) / 2;

  let baseRadius = 100 + index * 100;
  let radiusDrift = sin(elapsed * 0.1 + index) * 40 * progress;
  let radius = baseRadius + map(energy, 0, 255, 0, 60) + radiusDrift;

  let hue = (baseHue + index * 25) % 360;
  let alpha = map(energy, 0, 255, 15, 75) * (0.3 + beatPulse * 0.7);

  noFill();
  stroke(hue, 65, 95, alpha);
  strokeWeight(map(beatPulse, 0, 1, 0.5, 3) * (1 + progress));
  circle(0, 0, radius * 2);

  if (beatPulse > 0.92 && energy > 80) {
    ripples.push(new Ripple(radius, hue));
  }

  let markerCount = 24 + floor(progress * 24);
  for (let m = 0; m < markerCount; m++) {
    let angle = (m / markerCount) * 360 + elapsed * (5 + index * 3);
    let x = radius * cos(angle);
    let y = radius * sin(angle);
    fill(hue, 50, 100, alpha * 1.5);
    noStroke();
    circle(x, y, 2 + beatPulse * 4);
  }
}

class Ripple {
  constructor(startRadius, hue) {
    this.r = startRadius;
    this.maxR = startRadius + 300;
    this.hue = hue;
    this.alpha = 60;
  }
  update() {
    this.r += 4;
    this.alpha *= 0.96;
  }
  show(baseHue) {
    noFill();
    stroke(this.hue, 50, 100, this.alpha);
    strokeWeight(1);
    circle(0, 0, this.r * 2);
  }
  isDone() {
    return this.alpha < 1 || this.r > this.maxR;
  }
}

class Particle {
  constructor(index) {
    this.index = index;
    this.bin = floor(map(index, 0, 120, 2, 80));
    this.baseDistance = random(200, min(width, height) / 2);
    this.distance = this.baseDistance;
    this.driftAngle = random(360);
    this.size = random(1.5, 4);
    this.hueOffset = random(-30, 30);
    this.vx = 0;
    this.vy = 0;
    this.x = width / 2;
    this.y = height / 2;
    this.energy = 0;
  }

  update(spectrum, elapsed, progress, level) {
    let n = noise(this.index * 0.1, elapsed * 0.05);
    this.driftAngle += (n - 0.5) * (2 + progress * 4);
    this.energy = spectrum[this.bin];

    if (level > 0.3 && random() < 0.02) {
      let pushAngle = random(360);
      this.vx += cos(pushAngle) * 8;
      this.vy += sin(pushAngle) * 8;
    }

    this.distance = this.baseDistance + sin(elapsed * 10 + this.index) * (0.3 + progress * 20);

    let targetX = width / 2 + this.distance * cos(this.driftAngle);
    let targetY = height / 2 + this.distance * sin(this.driftAngle);

    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.92;
    this.vy *= 0.92;

    this.x = lerp(this.x, targetX, 0.02);
    this.y = lerp(this.y, targetY, 0.02);
  }

  show(baseHue) {
    let hue = (baseHue + this.hueOffset + 360) % 360;
    let alpha = map(this.energy, 0, 255, 5, 60);
    let s = this.size * (1 + this.energy / 200);

    noStroke();
    fill(hue, 40, 100, alpha);
    circle(this.x, this.y, s);
    fill(hue, 30, 100, alpha * 0.3);
    circle(this.x, this.y, s * 3);
  }
}

function setupRecorder() {
  let canvas = document.querySelector('canvas');
  let canvasStream = canvas.captureStream(30); // 30fps

  let audioContext = getAudioContext();
  let dest = audioContext.createMediaStreamDestination();
  song.connect(dest);

  let combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...dest.stream.getAudioTracks()
  ]);

  let mimeType = 'video/webm;codecs=vp9,opus';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm;codecs=vp8,opus';
  }
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm';
  }

  recorder = new MediaRecorder(combinedStream, { mimeType: mimeType });

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };

  recorder.onstop = () => {
    let blob = new Blob(recordedChunks, { type: 'video/webm' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = 'untolling-visualizer.webm';
    a.click();
    URL.revokeObjectURL(url);
    console.log('Recording saved.');
  };

  recorderReady = true;
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    if (!recorderReady) {
      setupRecorder();
    }
    if (!isRecording) {
      recordedChunks = [];
      recorder.start();
      isRecording = true;
      console.log('Recording started — press R again to stop.');
    } else {
      recorder.stop();
      isRecording = false;
      console.log('Recording stopped — file is downloading.');
    }
  }
}

function mousePressed() {
  if (song.isPlaying()) song.pause();
  else song.play();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(220, 30, 6);
}
