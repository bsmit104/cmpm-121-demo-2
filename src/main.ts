import "./style.css";

const app: HTMLDivElement = document.querySelector("#app")!;

const gameName = "Paint";

document.title = gameName;

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

const lines: { x: number; y: number }[][] = [];
const redoLines: { x: number; y: number }[][] = [];

let currentLine: { x: number; y: number }[] | null = null;

const cursor = { active: false, x: 0, y: 0 };

const canvasEventTarget = new EventTarget();

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  currentLine = [];
  lines.push(currentLine);
  redoLines.splice(nothing, redoLines.length);
  currentLine.push({ x: cursor.x, y: cursor.y });

  redraw();

  canvasEventTarget.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.active && currentLine) {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    currentLine.push({ x: cursor.x, y: cursor.y });

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
  if (ctx) {
    // ctx null check
    ctx.clearRect(nothing, nothing, canvas.width, canvas.height);
    for (const line of lines) {
      if (line.length > one) {
        ctx.beginPath();
        const { x, y } = line[nothing];
        ctx.moveTo(x, y);
        for (const { x, y } of line) {
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
  }
}

document.body.append(document.createElement("br"));

const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
container.append(clearButton);

clearButton.addEventListener("click", () => {
  lines.splice(nothing, lines.length);
  redraw();

  canvasEventTarget.dispatchEvent(new Event("drawing-changed"));
});

const undoButton = document.createElement("button");
undoButton.innerHTML = "undo";
container.append(undoButton);

undoButton.addEventListener("click", () => {
  if (lines.length > nothing) {
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
    const poppedRedoLine = redoLines.pop();
    if (poppedRedoLine) {
      lines.push(poppedRedoLine);
      redraw();

      canvasEventTarget.dispatchEvent(new Event("drawing-changed"));
    }
  }
});

// Add an observer for the "drawing-changed" event to clear and redraw lines
canvasEventTarget.addEventListener("drawing-changed", () => {
  redraw();
});
