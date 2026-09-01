/**
 * OptiPixel Studio - Audio Studio & Voice Recorder
 * Features browser microphone recording with real-time waveform visualizer and playback speed control
 */

class AudioStudioEngine {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.audioBlob = null;
    this.audioUrl = null;
    this.audioContext = null;
    this.analyser = null;
    this.animId = null;
  }

  async startRecording(visualizerCanvas) {
    this.audioChunks = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(stream);

    // Setup WebAudio Visualizer
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    source.connect(this.analyser);

    this.drawVisualizer(visualizerCanvas);

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.audioChunks.push(e.data);
    };

    this.mediaRecorder.start();
  }

  drawVisualizer(canvas) {
    if (!canvas || !this.analyser) return;
    const ctx = canvas.getContext('2d');
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      this.animId = requestAnimationFrame(render);
      this.analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.85;
        const grad = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        grad.addColorStop(0, '#06b6d4');
        grad.addColorStop(1, '#6366f1');
        ctx.fillStyle = grad;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 2;
      }
    };

    render();
  }

  stopRecording() {
    return new Promise((resolve) => {
      if (this.animId) cancelAnimationFrame(this.animId);
      if (!this.mediaRecorder) return resolve(null);

      this.mediaRecorder.onstop = () => {
        this.audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.audioUrl = URL.createObjectURL(this.audioBlob);
        resolve({ blob: this.audioBlob, url: this.audioUrl });
      };

      this.mediaRecorder.stop();
    });
  }
}

window.AudioStudioEngine = AudioStudioEngine;
