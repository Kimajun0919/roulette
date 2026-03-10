import { pad } from './utils';

export type RecordingReadyDetail = {
  blob: Blob;
  fileName: string;
};

export class VideoRecorder extends EventTarget {
  private mediaRecorder: MediaRecorder;
  private videoStream: MediaStream;
  private chunks: Blob[] = [];

  constructor(canvas: HTMLCanvasElement) {
    super();
    this.videoStream = canvas.captureStream();
    this.mediaRecorder = new MediaRecorder(this.videoStream, {
      videoBitsPerSecond: 6000000,
    });
  }

  public async start() {
    return new Promise<void>((rs) => {
      this.chunks = [];
      this.mediaRecorder.ondataavailable = (e: BlobEvent) => {
        this.chunks.push(e.data);
      };
      this.mediaRecorder.onstop = () => {
        this.dispatchEvent(
          new CustomEvent<RecordingReadyDetail>('recordingready', {
            detail: {
              blob: new Blob(this.chunks, { type: 'video/mp4' }),
              fileName: this.getFileName(),
            },
          })
        );
      };
      this.mediaRecorder.onstart = () => {
        rs();
      };
      this.mediaRecorder.start();
    });
  }

  public stop() {
    if (this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
  }

  public destroy() {
    this.stop();
    this.mediaRecorder.ondataavailable = null;
    this.mediaRecorder.onstop = null;
    this.mediaRecorder.onstart = null;
    this.videoStream.getTracks().forEach((track) => track.stop());
    this.chunks = [];
  }

  private getFileName() {
    const d = new Date();
    return `marble_roulette_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.mp4`;
  }
}
