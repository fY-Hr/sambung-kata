class SoundManager {
  private isMuted: boolean = false;

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public play(filePath: string) {
    if (this.isMuted) return;
    const audio = new Audio(filePath);
    audio.play().catch(() => {
      console.error(`Failed to play sound: ${filePath}`);
    });
  }

  public playCorrect() {
    this.play('/sounds/correct.mp3');
  }

  public playWrong() {
    this.play('/sounds/wrong.mp3');
  }

  public playWin() {
    this.play('/sounds/win.mp3');
  }

  public playStart() {
    this.play('/sounds/start.mp3');
  }
}

export const sounds = new SoundManager();


