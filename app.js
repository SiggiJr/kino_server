import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import "dotenv/config";
import { readFile, writeFile } from "node:fs/promises";

const PORT = process.env.PORT;

const app = express();

const transport = nodemailer.createTransport({
  host: process.env.HOST,
  port: 2525,
  auth: {
    user: process.env.BENUTZER,
    pass: process.env.PASSWORD,
  },
});

app.use(cors());
app.use(express.json());

const loadSeats = async () => {
  try {
    const data = await readFile("./utils/data.json", { encoding: "utf-8" });
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const seats = await loadSeats();

if (seats.length === 0) {
  for (let i = 0; i < 12; i++) {
    const seat = {
      id: i + 1,
      type: "loge",
      reserved: false,
      price: 11,
    };
    seats.push(seat);
  }
  for (let i = 12; i < 24; i++) {
    const seat = {
      id: i + 1,
      type: "parkett",
      reserved: false,
      price: 8,
    };
    seats.push(seat);
  }
  writeFile("./utils/data.json", JSON.stringify(seats, null, 2), { encoding: "utf-8" });
}

app.get("/api/saalplan", (req, res) => {
  res.json(seats);
});

app.patch("/api/saalplan", (req, res) => {
  const seat = seats.find((s) => s.id === req.body.id);
  seat.reserved = req.body.reserved;
  sendeMail(seat);
  writeFile("./utils/data.json", JSON.stringify(seats, null, 2), { encoding: "utf-8" });
  res.end();
});

app.post("/api/saalplan", (req, res) => {
  const resetSeats = req.body;
  seats.length = 0;
  resetSeats.forEach((seat) => {
    seats.push(seat);
  });
  writeFile("./utils/data.json", JSON.stringify(resetSeats, null, 2), { encoding: "utf-8" });

  res.end();
});

const sendeMail = (seat) => {
  const mail = {
    from: "system@cinema_magdeburg.de",
    to: "order@cinema_magdeburg.de",
    subject: "Neue Sitzplatz Buchung",
    text: `Platz Nummer ${seat.id} wurde gebucht, du hast ${seat.price}€ Umsatz gemacht.`,
  };
  transport.sendMail(mail);
};

app.listen(PORT, console.log("Server läuft auf PORT:", PORT));
