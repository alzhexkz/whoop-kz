// generate-icons.mjs
// Run: node generate-icons.mjs
import { createCanvas } from "canvas";
import { writeFileSync } from "fs";

function makeIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Background
  const grad = ctx.createRadialGradient(size * 0.4, size * 0.35, 0, size / 2, size / 2, size * 0.6);
  grad.addColorStop(0, "#0d1a14");
  grad.addColorStop(1, "#080810");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.22);
  ctx.fill();

  // Outer ring background
  const cx = size / 2, cy = size / 2;
  const r = size * 0.36;
  const stroke = size * 0.07;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(29,233,155,0.15)";
  ctx.lineWidth = stroke;
  ctx.stroke();

  // Green arc (75%)
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * 0.75);
  ctx.strokeStyle = "#1de99b";
  ctx.lineWidth = stroke;
  ctx.lineCap = "round";
  ctx.shadowColor = "#1de99b";
  ctx.shadowBlur = size * 0.06;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // "W" letter
  const fs = size * 0.28;
  ctx.font = `800 ${fs}px Arial, sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("W", cx, cy + size * 0.01);

  return canvas.toBuffer("image/png");
}

writeFileSync("public/icon-192.png", makeIcon(192));
writeFileSync("public/icon-512.png", makeIcon(512));
console.log("Icons generated: public/icon-192.png, public/icon-512.png");
