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
canvas.style.cursor = "none";

//let cursorCommand: CursorCommand | null = null;

let currentTool = "thin"; // set default to thin

const ctx = canvas.getContext("2d");

// lines created w marker line class
const lines: MarkerLine[] = [];
const redoLines: MarkerLine[] = [];
// let currentLine: MarkerLine | null = null;
// const cursor = { active: false, x: 0, y: 0 };
// const canvasEventTarget = new EventTarget();

function notify(name: string) {
  bus.dispatchEvent(new Event(name));
}

let cursorCommand: CursorCommand | null = null;

// heres a drawing-changed observer
const bus = new EventTarget();
bus.addEventListener("drawing-changed", () => {
  redraw();
});

bus.addEventListener("tool-changed", () => {
  redraw();
});

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

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length > one) {
      if (ctx) {
        ctx.strokeStyle = "black";
        ctx.lineWidth = this.lineWidth;
        ctx.beginPath();
        const { x, y } = this.points[0];
        ctx.moveTo(x, y);
        for (const { x, y } of this.points) {
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
  }
}

class CursorCommand {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  execute(ctx: CanvasRenderingContext2D) {
    if (ctx) {
      if (lineSize === bigStroke) {
        // Use a larger font size for the asterisk when using the "thick" tool
        ctx.font = "30px monospace"; // Adjust the size as needed
      } else {
        // Use a smaller font size for the asterisk when using the "thin" tool
        ctx.font = "10px monospace"; // Adjust the size as needed
      }
      ctx.fillText("*", this.x - 8, this.y + 16);
    }
  }
}

let currentLine: MarkerLine | null = null;

canvas.addEventListener("mouseout", () => {
  cursorCommand = null;
  notify("tool-changed");
});

canvas.addEventListener("mouseenter", (e) => {
  // Create the cursorCommand when the mouse enters the canvas
  cursorCommand = new CursorCommand(e.offsetX, e.offsetY);
  notify("tool-moved");
});

canvas.addEventListener("mousemove", (e) => {
  // Update the cursorCommand position
  cursorCommand = new CursorCommand(e.offsetX, e.offsetY);
  notify("tool-changed");
  // "tool-moved" event
  //canvasEventTarget.dispatchEvent(new CustomEvent("tool-moved", { detail: { x: cursor.x, y: cursor.y } }));

  if (e.buttons == 1 && currentLine) {
    cursorCommand = null; //remove when draw
    currentLine.drag(e.offsetX, e.offsetY);
    redraw();
    notify("drawing-changed");
  }
});

canvas.addEventListener("mousedown", (e) => {
  // set line size
  cursorCommand = null; //remove when draw
  if (currentTool === "thin") {
    lineSize = smallStroke;
  } else {
    lineSize = bigStroke;
  }
  currentLine = new MarkerLine({ x: e.offsetX, y: e.offsetY }, lineSize);
  lines.push(currentLine);
  redoLines.length = nothing;
  //currentLine.drag(cursor.x, cursor.y);
  notify("drawing-changed");
});

canvas.addEventListener("mouseup", () => {
  currentLine = null;
  // redraw();
  notify("drawing-changed");
});

function redraw() {
  // ctx null check
  if (ctx) {
    ctx.clearRect(nothing, nothing, canvas.width, canvas.height);
    lines.forEach((line) => line.display(ctx));
    if (cursorCommand) {
      cursorCommand.execute(ctx);
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
  redraw(); //potentially delete
  notify("drawing-changed");
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
      redraw(); //cld delete
      notify("drawing-changed");
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
      notify("drawing-changed");
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
  // if (ctx) {
  //   ctx.font = "10px monospace";
  //   ctx.fillText("*", this.x - 8, this.y + 16);
  // }
});

thickToolButton.addEventListener("click", () => {
  currentTool = "thick";
  thickToolButton.classList.add("selectedTool");
  thinToolButton.classList.remove("selectedTool");
  // if (ctx) {
  //   ctx.font = "30px monospace";
  //   ctx.fillText("*", this.x - 8, this.y + 16);
  // }
});