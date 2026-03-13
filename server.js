import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// ================= CONFIG =================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE = "https://my.gruppodgsrl.it/my/rest";
const EMAIL = "cosmolevano@gmail.com";
const PASSWORD = "05441661005";

const LABEL_DIR = path.join(__dirname, "labels");
// ==========================================

const app = express();
app.use(express.json());

let cachedToken = null;

// ===== LOGIN =====
async function login() {
  if (cachedToken) return cachedToken;

  console.log("🔐 Login...");
  const res = await fetch(`${BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD })
  });

  if (!res.ok) throw new Error("Login fallito");

  const data = await res.json();
  if (!data.token) throw new Error("Token non ricevuto");

  cachedToken = data.token;
  console.log("✅ Login OK");
  return cachedToken;
}

// ===== SALVA PDF =====
async function savePDF(base64, name) {
  await fs.mkdir(LABEL_DIR, { recursive: true });
  const filePath = path.join(LABEL_DIR, name);
  await fs.writeFile(filePath, Buffer.from(base64, "base64"));
  console.log("📄 PDF salvato:", filePath);
}

// ===== CREA SPEDIZIONE =====
async function creaSpedizioneAPI(jsonPayload) {
  const token = await login();

  const res = await fetch(`${BASE}/spedizioni`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify(jsonPayload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spedizione fallita → ${text}`);
  }

  const data = await res.json();

  // salva le etichette
  if (data.labels && Array.isArray(data.labels)) {
    for (let i = 0; i < data.labels.length; i++) {
      const label = data.labels[i];
      let base64, name;

      if (typeof label === 'string') {
        base64 = label;
        name = `label_${i + 1}.pdf`;
      } else if (label.content && label.filename) {
        base64 = label.content;
        name = label.filename;
      } else continue;

      await savePDF(base64, name);
    }
  }

  return data;
}

// ===== ENDPOINT: crea spedizione =====
app.post("/spedizione", async (req, res) => {
  try {
    const data = await creaSpedizioneAPI(req.body);
    res.json({ status: "ok", data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ===== ENDPOINT: scarica etichetta in Base64 =====
app.get("/etichetta/:id", async (req, res) => {
  try {
    const token = await login();
    const id = req.params.id;

    const URL = `${BASE}/spedizioni/ajax/getEtichettaOperativoProxy.php?token=${token}&spedizioneId=${id}`;
    const response = await fetch(URL, { headers: { "Accept": "application/pdf" } });

    if (!response.ok) return res.status(response.status).json({ error: "Errore download etichetta" });

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    res.json({ idSpedizione: id, base64 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ===== AVVIO SERVER =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server attivo sulla porta ${PORT}`));
