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

const edges = {
  "Tugu Jogja": { "Stasiun Tugu": 1, UGM: 4, Malioboro: 2 },
  "Stasiun Tugu": { Malioboro: 1 },
  Malioboro: { Keraton: 2, UGM: 4, "Tugu Jogja": 2 },
  Keraton: { "Alun-Alun Kidul": 1, UGM: 5, Malioboro: 2 },
  "Alun-Alun Kidul": { Bandara: 9, Keraton: 1 },
  UGM: { Monjali: 3, Bandara: 7 },
  Monjali: { Bandara: 8 },
};

// === UI Elements ===
const chatbox = document.getElementById("chatbox");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const canvas = document.getElementById("graphCanvas");
const ctx = canvas.getContext("2d");

// === Chat Utility ===
function addMessage(text, sender = "bot") {
  const msg = document.createElement("div");
  msg.classList.add(sender === "bot" ? "bot-message" : "user-message");
  msg.innerHTML = `<div class="bubble">${text}</div>`;
  chatbox.appendChild(msg);
  chatbox.scrollTop = chatbox.scrollHeight;
}

// === Dijkstra Algorithm ===
function dijkstra(start, end) {
  const distances = {};
  const previous = {};
  const pq = new Set(Object.keys(edges));

  for (let node of pq) distances[node] = Infinity;
  distances[start] = 0;

  while (pq.size) {
    let minNode = Array.from(pq).reduce((a, b) =>
      distances[a] < distances[b] ? a : b
    );
    pq.delete(minNode);

    if (minNode === end) break;

    for (let neighbor in edges[minNode]) {
      let alt = distances[minNode] + edges[minNode][neighbor];
      if (alt < distances[neighbor]) {
        distances[neighbor] = alt;
        previous[neighbor] = minNode;
      }
    }
  }

  let path = [];
  for (let at = end; at; at = previous[at]) path.unshift(at);
  return { path, distance: distances[end] };
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
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const pos = {
    "Tugu Jogja": [100, 80],
    "Stasiun Tugu": [200, 80],
    Malioboro: [300, 120],
    Keraton: [400, 200],
    "Alun-Alun Kidul": [420, 300],
    UGM: [250, 200],
    Monjali: [200, 300],
    Bandara: [520, 350],
  };

  // Draw edges
  ctx.strokeStyle = "#ccc";
  ctx.lineWidth = 1.5;
  for (let from in edges) {
    for (let to in edges[from]) {
      const [x1, y1] = pos[from];
      const [x2, y2] = pos[to];
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  // Highlight selected path
  if (path.length > 1) {
    ctx.strokeStyle = "#4f46e5";
    ctx.lineWidth = 3;
    for (let i = 0; i < path.length - 1; i++) {
      const [x1, y1] = pos[path[i]];
      const [x2, y2] = pos[path[i + 1]];
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  // Draw nodes
  for (let node in pos) {
    const [x, y] = pos[node];
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fillStyle = path.includes(node) ? "#4f46e5" : "#fff";
    ctx.fill();
    ctx.strokeStyle = "#333";
    ctx.stroke();
    ctx.font = "10px Poppins";
    ctx.fillStyle = "#111";
    ctx.fillText(node, x - 25, y - 25);
  }
}

// === Chatbot Logic ===
sendBtn.addEventListener("click", handleMessage);
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleMessage();
});

function handleMessage() {
  const text = input.value.trim();
  if (!text) return;
  addMessage(text, "user");
  input.value = "";

  const locations = extractLocations(text);
  if (!locations) {
    addMessage(
      "⚠️ Saya tidak mengenali destinasi tersebut. Coba sebutkan dua lokasi, seperti 'dari Malioboro ke UGM'."
    );
    return;
  }

  const { start, end } = locations;
  const result = dijkstra(start, end);

  if (result.distance === Infinity) {
    addMessage(`❌ Tidak ditemukan rute dari ${start} ke ${end}.`);
    return;
  }

  const routeText = result.path.join(" → ");
  addMessage(
    `✅ Rute terpendek adalah ${routeText}, dengan jarak sekitar ${result.distance} km.`
  );
  drawGraph(result.path);
}

drawGraph();
