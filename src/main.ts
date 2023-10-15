import "./style.css";

const app: HTMLDivElement = document.querySelector("#app")!;

const gameName = "Paint";

document.title = gameName;

// no magic numbers *eyebrow raise*
const canvasWidth = 256;
const canvasHeight = 256;
const nothing = 0;
const one = 1;

const container = document.createElement("div");
app.append(container);

const header = document.createElement("h1");
header.innerHTML = gameName;
container.append(header);

const canvas = document.createElement("canvas");
canvas.width = canvasWidth;
canvas.height = canvasHeight;
container.append(canvas);

const ctx = canvas.getContext("2d");

class MarkerLine {
  private points: { x: number; y: number }[];

  constructor(initialPosition: { x: number; y: number }) {
    this.points = [initialPosition];
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(context: CanvasRenderingContext2D) {
    if (this.points.length > one) {
      context.beginPath();
      const { x, y } = this.points[nothing];
      context.moveTo(x, y);
      for (const { x, y } of this.points) {
        context.lineTo(x, y);
      }
      context.stroke();
    }
  }
}

const lines: MarkerLine[] = [];
const redoLines: MarkerLine[] = [];
let currentLine: MarkerLine | null = null;

const cursor = { active: false, x: 0, y: 0 };

const canvasEventTarget = new EventTarget();

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  currentLine = new MarkerLine({ x: cursor.x, y: cursor.y });
  lines.push(currentLine);
  redoLines.length = nothing;
  currentLine.drag(cursor.x, cursor.y);

  redraw();

  canvasEventTarget.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.active && currentLine) {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    currentLine.drag(cursor.x, cursor.y);

    redraw();

    canvasEventTarget.dispatchEvent(new Event("drawing-changed"));
  }
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  currentLine = null;

  redraw();

  canvasEventTarget.dispatchEvent(new Event("drawing-changed"));
});

function redraw() {
  // ctx null check
  if (ctx) {
    ctx.clearRect(nothing, nothing, canvas.width, canvas.height);
    for (const line of lines) {
      line.display(ctx);
    }
  }
}

document.body.append(document.createElement("br"));

const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
container.append(clearButton);

clearButton.addEventListener("click", () => {
  lines.length = nothing;
  redraw();

  canvasEventTarget.dispatchEvent(new Event("drawing-changed"));
});

const undoButton = document.createElement("button");
undoButton.innerHTML = "undo";
container.append(undoButton);

undoButton.addEventListener("click", () => {
  if (lines.length > nothing) {
    // popped line to the redo stack
    const poppedLine = lines.pop();
    if (poppedLine) {
      redoLines.push(poppedLine);
      redraw();

      canvasEventTarget.dispatchEvent(new Event("drawing-changed"));
    }
  }
});

const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";
container.append(redoButton);

redoButton.addEventListener("click", () => {
  if (redoLines.length > nothing) {
    // popped redo line to the display list
    const poppedRedoLine = redoLines.pop();
    if (poppedRedoLine) {
      lines.push(poppedRedoLine);
      redraw();

      canvasEventTarget.dispatchEvent(new Event("drawing-changed"));
    }
  }
});
