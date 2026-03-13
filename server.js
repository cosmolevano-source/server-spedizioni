import express from "express";

const app = express();
app.use(express.json());

const BASE = "https://my.gruppodgsrl.it/my/rest";

const EMAIL = "cosmolevano@gmail.com";
const PASSWORD = "05441661005";


// LOGIN
async function login() {

  const res = await fetch(`${BASE}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      email: EMAIL,
      password: PASSWORD
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error("Login fallito: " + text);
  }

  const data = await res.json();

  return data.token;
}



// CREAZIONE SPEDIZIONE
app.post("/spedizione", async (req, res) => {

  try {

    const token = await login();

    const response = await fetch(`${BASE}/spedizioni`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();

    let labels = [];

    if (data.labels && Array.isArray(data.labels)) {

      for (let label of data.labels) {

        if (typeof label === "string") {

          labels.push({
            filename: "label.pdf",
            base64: label
          });

        } else if (label.content && label.filename) {

          labels.push({
            filename: label.filename,
            base64: label.content
          });

        }

      }

    }

    res.json({
      tracking: data.trackingNumber,
      labels: labels
    });

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: err.message });

  }

});



// SCARICA ETICHETTA
app.get("/etichetta/:id", async (req, res) => {

  try {

    const token = await login();
    const id = req.params.id;

    const url = `https://my.gruppodgsrl.it/app/spedizioni/ajax/getEtichettaOperativoProxy.php?token=${token}&spedizioneId=${id}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Errore download etichetta");
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const base64 = buffer.toString("base64");

    res.json({
      spedizioneId: id,
      base64: base64
    });

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: err.message });

  }

});



// TEST SERVER
app.get("/", (req, res) => {
  res.json({ status: "server spedizioni attivo" });
});



const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server attivo sulla porta " + PORT);
});
