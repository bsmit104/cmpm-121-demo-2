import "./style.css";

const app: HTMLDivElement = document.querySelector("#app")!;

const gameName = "Paint";

document.title = gameName;

// no magic numbers *eyebrow raise*
const canvasWidth = 256;
const canvasHeight = 256;
const nothing = 0;
const one = 1;
let lineSize = 2;
const smallStroke = 2;
const bigStroke = 5;

// make container for aesthetics
const container = document.createElement("div");
app.append(container);

const header = document.createElement("h1");
header.innerHTML = gameName;
container.append(header);

const canvas = document.createElement("canvas");
canvas.width = canvasWidth;
canvas.height = canvasHeight;
container.append(canvas);

let currentTool = "thin"; // set default to thin

const ctx = canvas.getContext("2d");

// marker line class
class MarkerLine {
  private points: { x: number; y: number }[];
  private lineWidth: number;

  constructor(initialPosition: { x: number; y: number }, lineWidth: number) {
    this.points = [initialPosition];
    this.lineWidth = lineWidth;
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(context: CanvasRenderingContext2D) {
    if (this.points.length > one) {
      context.beginPath();
      context.lineWidth = this.lineWidth;
      const { x, y } = this.points[nothing];
      context.moveTo(x, y);
      for (const { x, y } of this.points) {
        context.lineTo(x, y);
      }
      context.stroke();
    }
  }
}

// lines created w marker line class
const lines: MarkerLine[] = [];
const redoLines: MarkerLine[] = [];
let currentLine: MarkerLine | null = null;
const cursor = { active: false, x: 0, y: 0 };
const canvasEventTarget = new EventTarget();

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  // set line size
  if (currentTool === "thin") {
    lineSize = smallStroke;
  } else {
    lineSize = bigStroke;
  }

  currentLine = new MarkerLine({ x: cursor.x, y: cursor.y }, lineSize);
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

// clear button
const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
container.append(clearButton);

clearButton.addEventListener("click", () => {
  lines.length = nothing;
  redraw();

  canvasEventTarget.dispatchEvent(new Event("drawing-changed"));
});

// undo button
const undoButton = document.createElement("button");
undoButton.innerHTML = "undo";
container.append(undoButton);

undoButton.addEventListener("click", () => {
  if (lines.length > nothing) {
    // popped line to the redo stack
    const poppedLine = lines.pop();
    // empty stack check
    if (poppedLine) {
      redoLines.push(poppedLine);
      redraw();

      canvasEventTarget.dispatchEvent(new Event("drawing-changed"));
    }
  }
});

// redo button
const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";
container.append(redoButton);

redoButton.addEventListener("click", () => {
  if (redoLines.length > nothing) {
    // popped redo line to the display list
    const poppedRedoLine = redoLines.pop();
    // empty stack check
    if (poppedRedoLine) {
      lines.push(poppedRedoLine);
      redraw();

      canvasEventTarget.dispatchEvent(new Event("drawing-changed"));
    }
  }
});

// container 2 so buttons are below other buttons
const container2 = document.createElement("div");
app.append(container2);

const thinToolButton = document.createElement("button");
thinToolButton.innerHTML = "thin";
container2.append(thinToolButton);

const thickToolButton = document.createElement("button");
thickToolButton.innerHTML = "thick";
container2.append(thickToolButton);

thinToolButton.addEventListener("click", () => {
  currentTool = "thin";
  thinToolButton.classList.add("selectedTool");
  thickToolButton.classList.remove("selectedTool");
});

thickToolButton.addEventListener("click", () => {
  currentTool = "thick";
  thickToolButton.classList.add("selectedTool");
  thinToolButton.classList.remove("selectedTool");
});