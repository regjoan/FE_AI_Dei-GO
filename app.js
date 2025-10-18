// === Data Destinasi ===
const nodes = [
  "Tugu Jogja",
  "Stasiun Tugu",
  "Malioboro",
  "Keraton",
  "Alun-Alun Kidul",
  "UGM",
  "Monjali",
  "Bandara",
];

// === Graph (jarak untuk visualisasi, bukan untuk perhitungan) ===
const edges = {
  Monjali: { "Tugu Jogja": 2 },
  "Tugu Jogja": { "Stasiun Tugu": 1.5, UGM: 2, Malioboro: 2 },
  "Stasiun Tugu": { Malioboro: 1 },
  Malioboro: { Keraton: 2, UGM: 3, "Tugu Jogja": 2 },
  Keraton: { "Alun-Alun Kidul": 1, UGM: 4, Malioboro: 2 },
  "Alun-Alun Kidul": { Bandara: 8, Keraton: 1 },
  UGM: { Monjali: 3, Bandara: 7 },
  Bandara: {},
};

// === UI Elements ===
const chatbox = document.getElementById("chatbox");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const canvas = document.getElementById("graphCanvas");
const ctx = canvas.getContext("2d");

// === Transform state for zoom & pan ===
let scale = 1;
let originX = 0;
let originY = 0;
let isPanning = false;
let startPan = { x: 0, y: 0 };

// === Chat Utility ===
function addMessage(text, sender = "bot") {
  const msg = document.createElement("div");
  msg.classList.add(sender === "bot" ? "bot-message" : "user-message");
  msg.innerHTML = `<div class="bubble">${text}</div>`;
  chatbox.appendChild(msg);
  chatbox.scrollTop = chatbox.scrollHeight;
}

// === Simple NLP ===
function extractLocations(text) {
  text = text.toLowerCase();
  let found = [];
  for (let node of nodes) {
    if (text.includes(node.toLowerCase())) found.push(node);
  }
  if (found.length >= 2) return { start: found[1], end: found[0] };
  return null;
}

// === Graph Visualization ===
function drawGraph(path = []) {
  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, originX, originY);
  ctx.clearRect(
    -originX / scale,
    -originY / scale,
    canvas.width / scale,
    canvas.height / scale
  );

  const pos = {
    Monjali: [250, 60],
    "Tugu Jogja": [250, 150],
    "Stasiun Tugu": [250, 230],
    Malioboro: [250, 310],
    Keraton: [250, 400],
    "Alun-Alun Kidul": [250, 500],
    UGM: [500, 250],
    Bandara: [50, 550],
  };

  function drawCurvedLine(
    x1,
    y1,
    x2,
    y2,
    color = "#ccc",
    width = 1.5,
    distanceText = null
  ) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const cx = midX - dy * 0.15;
    const cy = midY + dx * 0.15;

    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(cx, cy, x2, y2);
    ctx.stroke();

    if (distanceText) {
      ctx.font = `${11 / scale}px Poppins`;
      ctx.fillStyle = "#555";
      ctx.textAlign = "center";
      ctx.fillText(distanceText, cx, cy - 5);
    }
  }

  for (let from in edges) {
    for (let to in edges[from]) {
      const [x1, y1] = pos[from];
      const [x2, y2] = pos[to];
      drawCurvedLine(x1, y1, x2, y2, "#ccc", 1.5, edges[from][to] + " km");
    }
  }

  if (path.length > 1) {
    for (let i = 0; i < path.length - 1; i++) {
      const [x1, y1] = pos[path[i]];
      const [x2, y2] = pos[path[i + 1]];
      drawCurvedLine(x1, y1, x2, y2, "#4f46e5", 3);
    }
  }

  for (let node in pos) {
    const [x, y] = pos[node];
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fillStyle = path.includes(node) ? "#4f46e5" : "#fff";
    ctx.fill();
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = `${11 / scale}px Poppins`;
    ctx.fillStyle = "#111";
    ctx.textAlign = "center";
    ctx.fillText(node, x, y - 28);
  }

  ctx.restore();
}

// === Zoom & Pan Controls ===
canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const mouseX = e.offsetX;
  const mouseY = e.offsetY;
  const delta = e.deltaY > 0 ? 0.9 : 1.1;

  originX = mouseX - (mouseX - originX) * delta;
  originY = mouseY - (mouseY - originY) * delta;
  scale *= delta;

  drawGraph();
});

canvas.addEventListener("mousedown", (e) => {
  isPanning = true;
  startPan = { x: e.clientX - originX, y: e.clientY - originY };
});

canvas.addEventListener("mousemove", (e) => {
  if (isPanning) {
    originX = e.clientX - startPan.x;
    originY = e.clientY - startPan.y;
    drawGraph();
  }
});

canvas.addEventListener("mouseup", () => (isPanning = false));
canvas.addEventListener("mouseleave", () => (isPanning = false));

// === Chatbot Logic ===
sendBtn.addEventListener("click", handleMessage);
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleMessage();
});

// ✅ Integrasi dengan Backend Flask
async function handleMessage() {
  const text = input.value.trim();
  if (!text) return;
  addMessage(text, "user");
  input.value = "";

  const locations = extractLocations(text);
  if (!locations) {
    addMessage(
      "⚠️ Saya tidak mengenali destinasi tersebut. Coba sebutkan dua lokasi."
    );
    return;
  }

  const { start, end } = locations;

  try {
    const response = await fetch("http://localhost:5000/api/route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start, end }),
    });

    const data = await response.json();

    if (data.error) {
      addMessage(`❌ ${data.error}`);
    } else {
      addMessage(
        `✅ Rute terpendek: ${data.path.join(" → ")} (${data.distance} km)`
      );
      drawGraph(data.path);
    }
  } catch (err) {
    console.error(err);
    addMessage("🚨 Gagal terhubung ke server backend.");
  }
}

// Initial draw
drawGraph();
