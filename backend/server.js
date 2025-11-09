import express from "express";
import cors from "cors";
import { initDB } from "./db.js";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("frontend"));

const db = await initDB();

// Получить всех персонажей пользователя
app.get("/api/characters/:telegram_id", async (req, res) => {
  const user = await db.get("SELECT * FROM users WHERE telegram_id = ?", [req.params.telegram_id]);
  if (!user) return res.json([]);

  const chars = await db.all("SELECT * FROM characters WHERE user_id = ?", [user.id]);
  res.json(chars);
});

// Создать персонажа
app.post("/api/character", async (req, res) => {
  const { telegram_id, name, className } = req.body;
  let user = await db.get("SELECT * FROM users WHERE telegram_id = ?", [telegram_id]);
  if (!user) {
    await db.run("INSERT INTO users (telegram_id) VALUES (?)", [telegram_id]);
    user = await db.get("SELECT * FROM users WHERE telegram_id = ?", [telegram_id]);
  }

  await db.run(
    "INSERT INTO characters (user_id, name, class, level, stats, hp) VALUES (?, ?, ?, ?, ?, ?)",
    [user.id, name, className, 1, JSON.stringify({ STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 }), 8]
  );

  res.json({ success: true });
});

// Повысить уровень
app.post("/api/levelup/:id", async (req, res) => {
  const char = await db.get("SELECT * FROM characters WHERE id = ?", [req.params.id]);
  if (!char) return res.status(404).json({ error: "Character not found" });

  const newLevel = char.level + 1;
  const newHp = char.hp + 5; // базовое увеличение
  await db.run("UPDATE characters SET level = ?, hp = ? WHERE id = ?", [newLevel, newHp, req.params.id]);
  res.json({ success: true, newLevel, newHp });
});

app.post("/api/character", async (req, res) => {
  const { telegram_id, name, className, race, subrace, background, stats } = req.body;

  let user = await db.get("SELECT * FROM users WHERE telegram_id = ?", [telegram_id]);
  if (!user) {
    await db.run("INSERT INTO users (telegram_id) VALUES (?)", [telegram_id]);
    user = await db.get("SELECT * FROM users WHERE telegram_id = ?", [telegram_id]);
  }

  await db.run(
    "INSERT INTO characters (user_id, name, class, level, stats, hp, token_url) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [user.id, name, className, 1, JSON.stringify(stats), 8, null]
  );

  res.json({ success: true });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
