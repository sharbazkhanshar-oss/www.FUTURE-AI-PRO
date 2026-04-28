// Simple file-based JSON database (no external DB needed to run locally)
// In production, swap this for MongoDB or PostgreSQL
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "data.json");

function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], messages: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = { loadDB, saveDB };
