import { BaseLayer } from './Layer';
import { WeatherState } from './types';

export class SignLayer extends BaseLayer {
  private hovering = false;
  private signX = 0;
  private signY = 0;
  private signWidth = 0;
  private signHeight = 0;
  private clickCallback: (() => void) | null = null;
  private isDemo = false;

  setDemoMode(demo: boolean) {
    this.isDemo = demo;
  }

  setClickCallback(callback: () => void) {
    this.clickCallback = callback;
  }

  update(_dt: number) {
    // Static layer - no animation needed
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.state) return;

    const groundY = this.height * 0.7;

    // Position sign on ground near trees (right side)
    this.signX = this.width * 0.75;
    this.signY = groundY - 30; // On ground level

    // Draw wooden post (even smaller)
    const postWidth = 5;
    const postHeight = 35;

    ctx.fillStyle = '#4a3728';
    ctx.fillRect(
      this.signX - postWidth / 2,
      this.signY,
      postWidth,
      postHeight
    );

    // Draw sign board (even smaller)
    const boardWidth = 160;
    const boardHeight = 40;
    this.signWidth = boardWidth;
    this.signHeight = boardHeight;

    const boardX = this.signX - boardWidth / 2;
    const boardY = this.signY + 20;

    // Board shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(boardX + 4, boardY + 4, boardWidth, boardHeight);

    // Board background
    ctx.fillStyle = this.hovering ? '#3d2f23' : '#5a4332';
    ctx.fillRect(boardX, boardY, boardWidth, boardHeight);

    // Board border
    ctx.strokeStyle = '#2a1f18';
    ctx.lineWidth = 3;
    ctx.strokeRect(boardX, boardY, boardWidth, boardHeight);

    // Wood grain detail
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const y = boardY + 20 + i * 15;
      ctx.beginPath();
      ctx.moveTo(boardX + 10, y);
      ctx.lineTo(boardX + boardWidth - 10, y);
      ctx.stroke();
    }

    // Text (smaller)
    ctx.fillStyle = this.hovering ? '#ffffff' : '#f0e6d2';
    ctx.font = '9px "DM Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const text1 = this.isDemo ? 'Biome Generation' : 'Why does your';
    const text2 = this.isDemo ? 'Criteria' : 'world look like this?';

    ctx.fillText(text1, this.signX, boardY + boardHeight / 2 - 6);
    ctx.fillText(text2, this.signX, boardY + boardHeight / 2 + 6);

    // Hover indicator
    if (this.hovering) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(boardX - 2, boardY - 2, boardWidth + 4, boardHeight + 4);

      // Cursor hint
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '8px "DM Sans", sans-serif';
      const hoverHint = this.isDemo ? 'Click to view' : 'Click to learn';
      ctx.fillText(hoverHint, this.signX, boardY + boardHeight + 10);
    }
  }

  checkHover(x: number, y: number): boolean {
    const boardX = this.signX - this.signWidth / 2;
    const boardY = this.signY + 20;

    const isHovering = (
      x >= boardX &&
      x <= boardX + this.signWidth &&
      y >= boardY &&
      y <= boardY + this.signHeight
    );

    this.hovering = isHovering;
    return isHovering;
  }

  handleClick(x: number, y: number): boolean {
    if (this.checkHover(x, y) && this.clickCallback) {
      this.clickCallback();
      return true;
    }
    return false;
  }
}
