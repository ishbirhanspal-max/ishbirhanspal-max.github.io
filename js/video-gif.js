/**
 * OptiPixel Studio - Video to GIF & High-Res Frame Extractor
 * Uses HTML5 Video and Canvas APIs to capture video frames and generate animated GIFs
 */

class VideoGIFEngine {
  /**
   * Captures the current active frame of a video element as a high-res PNG canvas
   */
  static captureFrame(videoElement) {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth || 1280;
    canvas.height = videoElement.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  /**
   * Samples frames from video to build an animated sequence
   */
  static async extractFrameSequence(videoElement, maxFrames = 10) {
    const frames = [];
    const duration = videoElement.duration || 5;
    const interval = duration / maxFrames;

    for (let i = 0; i < maxFrames; i++) {
      videoElement.currentTime = i * interval;
      await new Promise(r => {
        videoElement.onseeked = r;
      });
      const c = this.captureFrame(videoElement);
      frames.push(c);
    }

    return frames;
  }
}

window.VideoGIFEngine = VideoGIFEngine;
