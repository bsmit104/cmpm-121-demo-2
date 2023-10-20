import "./style.css";

const app: HTMLDivElement = document.querySelector("#app")!;

const gameName = "Paint";

document.title = gameName;

// no magic numbers *eyebrow raise*
const canvasWidth = 500;
const canvasHeight = 256;
const nothing = 0;
const one = 1;
let lineSize = 2;
const smallStroke = 2;
const bigStroke = 5;

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
// let currentLine: MarkerLine | null = null;
// const cursor = { active: false, x: 0, y: 0 };
// const canvasEventTarget = new EventTarget();

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
let currentLine: MarkerLine | StickerCommand = new MarkerLine({ x: 0, y: 0 }, 0);

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

  if (e.buttons == 1 && currentLine) {
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
      currentLine = new MarkerLine({ x: e.offsetX, y: e.offsetY }, lineSize);
    }
  }
  lines.push(currentSticker ?? currentLine); // Use the current sticker if available
  redoLines.length = nothing;
  //currentLine.drag(cursor.x, cursor.y);
  notify("drawing-changed");
});

// canvas.addEventListener("mousedown", (e) => {
//   // set line size
//   // if (cursorCommand && cursorCommand.s) {
//     if (cursorCommand && cursorCommand.s) {
//       currentSticker = new StickerCommand(e.offsetX, e.offsetY, cursorCommand.s);
//     } else {
//       cursorCommand = null; //remove when draw
//       if (currentTool === "thin") {
//         lineSize = smallStroke;
//       } else {
//         lineSize = bigStroke;
//       }
//     currentLine = new MarkerLine({ x: e.offsetX, y: e.offsetY }, lineSize);
//       currentSticker = null;
//     }
//   lines.push(currentLine);
//   redoLines.length = nothing;
//   //currentLine.drag(cursor.x, cursor.y);
//   notify("drawing-changed");
// });

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
    ctx.clearRect(nothing, nothing, canvas.width, canvas.height);
    lines.forEach((line) => line.display(ctx));
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

const container3 = document.createElement("div");
app.append(container3);

// container 2 so buttons are below other buttons
const stickers = ["🎃", "👽", "👻", "🤡", "🐷", "🐛"];
for (const sticker of stickers) {
  const stickerButton = document.createElement("button");
  stickerButton.className = "sticker-button";
  stickerButton.type = "button";
  stickerButton.innerHTML = sticker; // Display the sticker as the button label

  // Event listener for each button
  stickerButton.addEventListener("click", (e) => {
    // Implement the command pattern for sticker placement
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

// Function to create a custom sticker
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

    // Listen for mousemove event to update the custom sticker's position
    canvas.addEventListener("mousemove", stickerPlacementHandler);

    // Inform the user to click on the canvas to place the sticker
    alert("Click on the canvas to place the custom sticker.");
  }
}

function stickerPlacementHandler(e: MouseEvent) {
  if (isPlacingCustomSticker) {
    cursorCommand = new CursorCommand(e.offsetX, e.offsetY, "");
    redraw();

    if (e.buttons === 1) {
      // If the mouse button is clicked, place the sticker
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
// Create a button for creating a custom sticker
const customStickerButton = document.createElement("button");
customStickerButton.innerHTML = "Create Custom Sticker (double click to place)";
container4.append(customStickerButton);

// Add a click event listener to the custom sticker button
customStickerButton.addEventListener("click", createCustomSticker);