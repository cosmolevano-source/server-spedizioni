import express from "express";
import fetch from "node-fetch"; // necessario se Node < 18, altrimenti puoi usare fetch nativo

const app = express();
const TOKEN = "8804fac6c8383d246165ca2150c7976d"; // il tuo token

// ===== API: scarica etichetta in Base64 =====
app.get("/etichetta/:id", async (req, res) => {
  const id = req.params.id;

  const URL = `https://my.gruppodgsrl.it/app/spedizioni/ajax/getEtichettaOperativoProxy.php?token=${TOKEN}&spedizioneId=${id}`;

  try {
    const response = await fetch(URL, {
      method: "GET",
      headers: { "Accept": "application/pdf" }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "Errore download etichetta" });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");

    res.json({
      idSpedizione: id,
      base64: base64
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore interno server" });
  }
});

// Porta di ascolto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server attivo sulla porta ${PORT}`);
});
