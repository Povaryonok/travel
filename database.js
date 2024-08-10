const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, email TEXT, password TEXT)");
  db.run("CREATE TABLE posts (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, content TEXT, cost INTEGER, currency TEXT, convenience INTEGER, safety INTEGER, population INTEGER, vegetation INTEGER, user_id INTEGER, FOREIGN KEY(user_id) REFERENCES users(id))");
  db.run("CREATE TABLE images (id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER, image_path TEXT, FOREIGN KEY(post_id) REFERENCES posts(id))");
});

module.exports = db;
