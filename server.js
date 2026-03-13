const express = require("express");
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server spedizioni attivo");
});

app.post("/spedizione", (req, res) => {

  const dati = req.body;

  console.log("Dati spedizione:", dati);

  res.json({
    status: "ok",
    messaggio: "spedizione ricevuta"
  });

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server attivo sulla porta " + PORT);
});
