// Phones and tablets: touch mode (body.touch), landscape only, and the walking joystick.
//
// Touch mode turns on for devices whose main pointer is a finger, or on the first touch. In it
// the HUD swaps to on-screen controls (style.css, body.touch): the joystick on the left, the
// attack button with the skill slots around it on the right, and windows open one at a time.

export function isTouch(): boolean {
  return document.body.classList.contains("touch");
}

const listeners: (() => void)[] = [];

// Call fn now if touch mode is on, and again whenever it turns on.
export function onTouchMode(fn: () => void): void {
  listeners.push(fn);
  if (isTouch()) fn();
}

export function detectTouch(): void {
  const enable = () => {
    if (isTouch()) return;
    document.body.classList.add("touch");
    for (const fn of listeners) fn();
  };
  if (matchMedia("(pointer: coarse)").matches) enable();
  window.addEventListener("pointerdown", (e) => e.pointerType === "touch" && enable(), { capture: true });
}

// Full screen and landscape, where the browser allows it (Android; iOS has neither for pages).
// Must run inside a tap.
export async function goLandscape(): Promise<void> {
  if (!isTouch()) return;
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen({ navigationUI: "hide" });
  } catch {
    // refused: keep playing in the page
  }
  try {
    await (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.("landscape");
  } catch {
    // not supported or not in full screen: the portrait overlay asks the player to turn the phone
  }
}

// A thumb stick: press anywhere in its zone and drag. The base appears under the thumb, the knob
// follows it up to RANGE px away; `vec` is the push in screen terms (x right, y down), length 0..1.
const RANGE = 52;
const DEAD = 0.18;

export class Joystick {
  el: HTMLElement;
  knob: HTMLElement;
  id: number | null = null;
  ox = 0;
  oy = 0;
  vec = { x: 0, y: 0 };

  constructor() {
    this.el = document.createElement("div");
    this.el.className = "joystick";
    this.el.setAttribute("aria-hidden", "true");
    this.knob = document.createElement("div");
    this.knob.className = "joystick-knob";
    this.el.append(this.knob);
    document.body.append(this.el);
  }

  get active(): boolean {
    return this.id !== null;
  }

  // The push as camera-relative steps: forward is up the screen, left is left.
  get steps(): { fwd: number; left: number } {
    const len = Math.hypot(this.vec.x, this.vec.y);
    if (len < DEAD) return { fwd: 0, left: 0 };
    return { fwd: -this.vec.y, left: -this.vec.x };
  }

  start(e: PointerEvent): void {
    this.id = e.pointerId;
    this.ox = e.clientX;
    this.oy = e.clientY;
    this.el.classList.add("on");
    this.el.style.left = `${e.clientX}px`;
    this.el.style.top = `${e.clientY}px`;
    this.move(e);
  }

  move(e: PointerEvent): void {
    if (e.pointerId !== this.id) return;
    let dx = e.clientX - this.ox, dy = e.clientY - this.oy;
    const d = Math.hypot(dx, dy);
    if (d > RANGE) {
      dx *= RANGE / d;
      dy *= RANGE / d;
    }
    this.vec = { x: dx / RANGE, y: dy / RANGE };
    this.knob.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  end(e?: PointerEvent): void {
    if (e && e.pointerId !== this.id) return;
    this.id = null;
    this.vec = { x: 0, y: 0 };
    this.knob.style.transform = "";
    this.el.classList.remove("on");
    this.el.style.left = "";
    this.el.style.top = "";
  }
}
