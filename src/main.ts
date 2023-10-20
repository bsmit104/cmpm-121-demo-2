import "./style.css";

const app: HTMLDivElement = document.querySelector("#app")!;

const gameName = "Paint";

document.title = gameName;

// no magic numbers *eyebrow raise*
const canvasWidth = 500;
const canvasHeight = 256;
const zero = 0;
const one = 1;
let lineSize = 2;
const smallStroke = 2;
const bigStroke = 5;

const createButton = (container: HTMLElement, text: string, clickHandler: () => void) => {
  const button = document.createElement("button");
  button.innerHTML = text;
  container.appendChild(button);
  button.addEventListener("click", clickHandler);
  return button;
};

// make container for aesthetics
const container0 = document.createElement("div");
app.append(container0);

const container = document.createElement("div");
app.append(container);

const header = document.createElement("h1");
header.innerHTML = gameName;
container0.append(header);

const canvas = document.createElement("canvas");
canvas.width = canvasWidth;
canvas.height = canvasHeight;
container0.append(canvas);
canvas.style.cursor = "none";

//let cursorCommand: CursorCommand | null = null;

let currentTool = "thin"; // set default to thin

const ctx = canvas.getContext("2d");

// lines created w marker line class
const lines: (MarkerLine | StickerCommand)[] = [];
const redoLines: (MarkerLine | StickerCommand)[] = [];

function notify(name: string) {
  bus.dispatchEvent(new Event(name));
}

let cursorCommand: CursorCommand | null = null;

let currentSticker: StickerCommand | null = null;

// heres a drawing-changed observer
const bus = new EventTarget();
bus.addEventListener("drawing-changed", () => {
  redraw();
});

bus.addEventListener("tool-changed", () => {
  redraw();
});

const colorPicker = document.createElement("input");
colorPicker.type = "color";
colorPicker.value = "#000000"; // Set the default color
container0.appendChild(colorPicker);

colorPicker.addEventListener("input", (e: Event) => {
  if (e.target instanceof HTMLInputElement) {
    const selectedColor = e.target.value;
    updateLineColor(selectedColor);
  }
});

function updateLineColor(color: string) {
  if (currentTool === "thin" && currentLine instanceof MarkerLine) {
    currentLine.setLineColor(color);
  } else if (currentTool === "thick" && currentLine instanceof MarkerLine) {
    currentLine.setLineColor(color);
  }
}
// marker line class
// Update the MarkerLine class to store and use the line color
let selectedColor = "#000000"; 

colorPicker.addEventListener("input", (e: Event) => {
  if (e.target instanceof HTMLInputElement) {
    selectedColor = e.target.value; // Update the selected color
  }
});
class MarkerLine {
  private points: { x: number; y: number }[];
  private lineWidth: number;
  private lineColor: string;
  private originalColor: string;

  constructor(initialPosition: { x: number; y: number }, lineWidth: number, lineColor: string) {
    this.points = [initialPosition];
    this.lineWidth = lineWidth;
    this.lineColor = lineColor;
    this.originalColor = lineColor;
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  setLineColor(color: string) {
    this.lineColor = color;
  }

  resetToOriginalColor() {
    this.lineColor = this.originalColor;
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length > one) {
      if (ctx) {
        ctx.strokeStyle = this.lineColor;
        ctx.lineWidth = this.lineWidth;
        ctx.beginPath();
        const { x, y } = this.points[zero];
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
  s: string;
  pos: { x: number; y: number };
  constructor(x: number, y: number, s: string) {
    this.x = x;
    this.y = y;
    this.s = s;
    this.pos = { x, y };
  }
  execute(ctx: CanvasRenderingContext2D) {
    if (ctx) {
      if (this.s) {
        ctx.font = "10px monospace";
        ctx.fillText(this.s, this.x - 8, this.y + 16);
      } else {
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
}

//let cursorCommand: CursorCommand = new CursorCommand(0, 0, "");

class StickerCommand {
  x: number;
  y: number;
  s: string;
  pos: { x: number; y: number };

  constructor(x: number, y: number, s: string) {
    this.x = x;
    this.y = y;
    this.s = s;
    this.pos = { x, y };
  }

  display(ctx: CanvasRenderingContext2D) {
    if (ctx) {
      ctx.font = "30px sans-serif"; // Adjust the size as needed
      ctx.fillText(this.s, this.pos.x, this.pos.y);
    }
  }
  drag(x: number, y: number) {
    this.pos = { x: x, y: y };
  }
}

//let currentLine: MarkerLine | StickerCommand | null = null;
let currentLine: MarkerLine | StickerCommand = new MarkerLine({ x: 0, y: 0 }, zero, "");

canvas.addEventListener("mouseout", () => {
  cursorCommand = null;
  currentSticker = null;
  notify("tool-changed");
});

canvas.addEventListener("mouseenter", (e) => {
  // Create the cursorCommand when the mouse enters the canvas
  // if (cursorCommand) {
  //   cursorCommand.pos = { x: e.offsetX, y: e.offsetY };
  // }
  cursorCommand = new CursorCommand(e.offsetX, e.offsetY, "");
  notify("tool-moved");
});

canvas.addEventListener("mousemove", (e) => {
  // Update the cursorCommand position
  // if (cursorCommand) {
  //   cursorCommand.pos = { x: e.offsetX, y: e.offsetY };
  // }
  cursorCommand = new CursorCommand(e.offsetX, e.offsetY, "");
  if (currentSticker) {
    // If a sticker is currently being moved, update its position
    currentSticker.drag(e.offsetX, e.offsetY);
  }
  notify("tool-changed");
  // "tool-moved" event
  //canvasEventTarget.dispatchEvent(new CustomEvent("tool-moved", { detail: { x: cursor.x, y: cursor.y } }));

  if (e.buttons == one && currentLine) {
    cursorCommand = null; //remove when draw
    currentLine.drag(e.offsetX, e.offsetY);
    redraw();
    notify("drawing-changed");
  }
});

canvas.addEventListener("mousedown", (e) => {
  if (cursorCommand) {
    if (cursorCommand.s) {
      currentSticker = new StickerCommand(e.offsetX, e.offsetY, cursorCommand.s);
    } else {
      //cursorCommand = null; //remove when draw
      if (currentTool === "thin") {
        lineSize = smallStroke;
      } else {
        lineSize = bigStroke;
      }
      currentLine = new MarkerLine({ x: e.offsetX, y: e.offsetY }, lineSize, selectedColor);
    }
  }
  lines.push(currentSticker ?? currentLine); // Use the current sticker if available
  redoLines.length = zero;
  //currentLine.drag(cursor.x, cursor.y);
  notify("drawing-changed");
});

canvas.addEventListener("mouseup", () => {
  // currentLine = null;
  // redraw();
  if (currentSticker) {
    // If a sticker was being placed, set currentSticker to null
    currentSticker = null;
  }
  //currentLine = null as unknown as MarkerLine | StickerCommand;
  notify("drawing-changed");
});

function redraw() {
  // ctx null check
  if (ctx) {
    ctx.clearRect(zero, zero, canvas.width, canvas.height);
    lines.forEach((line) => {
      if (line instanceof MarkerLine) {
        line.resetToOriginalColor(); // Reset to the original color
        line.display(ctx);
      } else {
        line.display(ctx);
      }
    });
    if (cursorCommand) {
      cursorCommand.execute(ctx);
    }
    if (currentSticker) {
      currentSticker.display(ctx);
    }
  }
}

document.body.append(document.createElement("br"));

// clear button
createButton(container, "clear", () => {
  lines.length = zero;
  redraw();
  notify("drawing-changed");
});

// undo button
createButton(container, "undo", () => {
  if (lines.length > zero) {
    const poppedLine = lines.pop();
    if (poppedLine) {
      redoLines.push(poppedLine);
      redraw();
      notify("drawing-changed");
    }
  }
});

// redo button
createButton(container, "redo", () => {
  if (redoLines.length > zero) {
    const poppedRedoLine = redoLines.pop();
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

const thinToolButton = createButton(container2, "thin", () => {
  currentTool = "thin";
  thinToolButton.classList.add("selectedTool");
  thickToolButton.classList.remove("selectedTool");
});

const thickToolButton = createButton(container2, "thick", () => {
  currentTool = "thick";
  thickToolButton.classList.add("selectedTool");
  thinToolButton.classList.remove("selectedTool");
});

const lineButton = document.createElement("button");
lineButton.innerHTML = "Pen";
container2.append(lineButton);

lineButton.addEventListener("click", () => {
  cursorCommand!.s = "";
});

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

// container 3 so buttons are below other buttons
const container3 = document.createElement("div");
app.append(container3);

// sticker buttons
const stickers = ["🎃", "👽", "👻", "🤡", "🐷", "🐛"];
for (const sticker of stickers) {
  const stickerButton = document.createElement("button");
  stickerButton.className = "sticker-button";
  stickerButton.type = "button";
  stickerButton.innerHTML = sticker;

  stickerButton.addEventListener("click", (e) => {
    const stickerCommand = new StickerCommand(e.offsetX, e.offsetY, sticker);
    currentSticker = stickerCommand;
    if (ctx) {
      stickerCommand.display(ctx);
    }
    lines.push(stickerCommand);
    notify("drawing-changed");
  });

  // Append the button to the container
  container3.append(stickerButton);
}

let isPlacingCustomSticker = false;
let customStickerContent = "";

// create custom sticker
// asked chat gpt for examples
function createCustomSticker() {
  if (isPlacingCustomSticker) {
    return; // Return if already placing a sticker
  }

  const inputContent = prompt("Enter your custom sticker:");

  if (inputContent !== null) { // Check if inputContent is not null
    customStickerContent = inputContent;

    // Set a flag to indicate that a custom sticker is being placed
    isPlacingCustomSticker = true;
    canvas.style.cursor = "crosshair"; // Change the cursor style

    canvas.addEventListener("mousemove", stickerPlacementHandler);

    alert("Click on the canvas to place the custom sticker.");
  }
}

function stickerPlacementHandler(e: MouseEvent) {
  if (isPlacingCustomSticker) {
    cursorCommand = new CursorCommand(e.offsetX, e.offsetY, "");
    redraw();

    if (e.buttons === one) {
      // place the sticker on click
      const x = e.offsetX;
      const y = e.offsetY;
      const stickerContent = customStickerContent;
      const stickerCommand = new StickerCommand(x, y, stickerContent);
      lines.push(stickerCommand);
      notify("drawing-changed");
      redraw();
      isPlacingCustomSticker = false;
      canvas.style.cursor = "none"; // Reset cursor style
      canvas.removeEventListener("mousemove", stickerPlacementHandler);
    }
  }
}

const container4 = document.createElement("div");
app.append(container4);

// custom sticker
const customStickerButton = document.createElement("button");
customStickerButton.innerHTML = "Create Custom Sticker (double click to place)";
container4.append(customStickerButton);

customStickerButton.addEventListener("click", createCustomSticker);

function exportCanvas() {
  const exportCanvas = document.createElement("canvas");
  const scaleFactor = 4; // Scale factor
  exportCanvas.width = canvasWidth * scaleFactor;
  exportCanvas.height = canvasHeight * scaleFactor;
  const exportCtx = exportCanvas.getContext("2d");

  // white background
  if (exportCtx) {
    exportCtx.fillStyle = "white";
    exportCtx.fillRect(zero, zero, exportCanvas.width, exportCanvas.height);
    exportCtx.scale(scaleFactor, scaleFactor);
  }

  lines.forEach((item) => {
    if (item instanceof StickerCommand || item instanceof MarkerLine) {
      if (exportCtx) {
        item.display(exportCtx);
      }
    }
  });

  // Convert to PNG image
  const exportDataUrl = exportCanvas.toDataURL("image/png");

  // download link and download
  const a = document.createElement("a");
  a.href = exportDataUrl;
  a.download = "exported_canvas.png";
  a.click();
}

// export button
const exportButton = document.createElement("button");
exportButton.innerHTML = "Export";
container2.append(exportButton);

exportButton.addEventListener("click", exportCanvas);

/////////////////inspo from Adam Smith's https://glitch.com/edit/#!/shoddy-paint?path=paint1.html%3A19%3A0//////////////////