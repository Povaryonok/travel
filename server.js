const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const db = require('./database');
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.post('/register', (req, res) => {
  const { username, email, password } = req.body;
  const stmt = db.prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
  stmt.run(username, email, password, (err) => {
    if (err) {
      res.status(500).send('Ошибка регистрации пользователя');
    } else {
      res.send('Пользователь успешно зарегистрирован');
    }
  });
  stmt.finalize();
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
    if (err) {
      res.status(500).send('Ошибка входа');
    } else if (!row) {
      res.status(401).send('Неверное имя пользователя или пароль');
    } else {
      res.redirect(`/home?username=${username}`);
    }
  });
});

app.post('/create-post', upload.array('images', 5), (req, res) => {
  const { title, content, cost, currency, convenience, safety, population, vegetation, author } = req.body;
  db.serialize(() => {
    // Находим ID пользователя по имени
    db.get("SELECT id FROM users WHERE username = ?", [author], (err, row) => {
      if (err || !row) {
        res.status(500).send('Ошибка создания поста');
        return;
      }
      const userId = row.id;
      
      const stmt = db.prepare("INSERT INTO posts (title, content, cost, currency, convenience, safety, population, vegetation, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
      stmt.run(title, content, cost, currency, convenience, safety, population, vegetation, userId, function(err) {
        if (err) {
          res.status(500).send('Ошибка создания поста');
        } else {
          const postId = this.lastID;
          const imageStmt = db.prepare("INSERT INTO images (post_id, image_path) VALUES (?, ?)");
          req.files.forEach(file => {
            imageStmt.run(postId, `/uploads/${file.filename}`);
          });
          imageStmt.finalize();
          res.send('Пост успешно создан');
        }
      });
      stmt.finalize();
    });
  });
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.get('/posts', (req, res) => {
  db.all("SELECT posts.id, posts.title, posts.content, posts.cost, posts.currency, posts.convenience, posts.safety, posts.population, posts.vegetation, images.image_path, users.username AS author FROM posts LEFT JOIN images ON posts.id = images.post_id LEFT JOIN users ON posts.user_id = users.id", (err, rows) => {
    if (err) {
      res.status(500).send('Ошибка получения постов');
    } else {
      const posts = rows.reduce((acc, row) => {
        const { id, title, content, cost, currency, convenience, safety, population, vegetation, image_path, author } = row;
        if (!acc[id]) {
          acc[id] = { id, title, content, cost, currency, convenience, safety, population, vegetation, author, images: [] };
        }
        if (image_path) {
          acc[id].images.push(image_path);
        }
        return acc;
      }, {});
      res.json(Object.values(posts));
    }
  });
});

app.get('/my-posts', (req, res) => {
  const username = req.query.username;
  db.all("SELECT posts.id, posts.title, posts.content, posts.cost, posts.currency, posts.convenience, posts.safety, posts.population, posts.vegetation, images.image_path, users.username AS author FROM posts LEFT JOIN images ON posts.id = images.post_id LEFT JOIN users ON posts.user_id = users.id WHERE users.username = ?", [username], (err, rows) => {
    if (err) {
      res.status(500).send('Ошибка получения постов');
    } else {
      const posts = rows.reduce((acc, row) => {
        const { id, title, content, cost, currency, convenience, safety, population, vegetation, image_path, author } = row;
        if (!acc[id]) {
          acc[id] = { id, title, content, cost, currency, convenience, safety, population, vegetation, author, images: [] };
        }
        if (image_path) {
          acc[id].images.push(image_path);
        }
        return acc;
      }, {});
      res.json(Object.values(posts));
    }
  });
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
