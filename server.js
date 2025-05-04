import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import pg from "pg";
// import axios from "axios";
import 'dotenv/config';
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.port || 3000;


// PostgreSQL config
const pool = new pg.Pool({
  user: process.env.user,
  host: process.env.host,
  database: process.env.database,
  password: process.env.password,
  port: process.env.db_port || 5432,
});
// db.connect();

// Support __dirname with ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// ------------------- Data Handling -----------------------

let posts = [];

async function getPosts() {
  const result = await pool.query("SELECT * FROM blog ORDER BY id ASC;");
  posts = result.rows;
}

async function findPost(postId) {
  const result = await pool.query("SELECT * FROM blog WHERE id=$1", [postId]);
  return result.rows[0];
}

async function createPost(title, content, author) {
  await pool.query("INSERT INTO blog(title, content, author) VALUES($1, $2, $3)", [title, content, author]);
  await getPosts();
}

async function editPost(id, title, content, author, date) {
  const post = await findPost(id);
  await pool.query(
    "UPDATE blog SET title=$1, content=$2, author=$3, date=$4 WHERE id=$5",
    [title || post.title, content || post.content, author || post.author, date, id]
  );
  await getPosts();
}

async function deletePost(id) {
  await pool.query("DELETE FROM blog WHERE id=$1", [id]);
  await getPosts();
}

async function deleteAll() {
  await pool.query("DELETE FROM blog");
  await getPosts();
}

// ------------------- API Routes -----------------------

app.get("/posts", async (req, res) => {
  await getPosts();
  res.json(posts);
});

app.get("/posts/:id", async (req, res) => {
  const post = await findPost(parseInt(req.params.id));
  res.json(post);
});

app.post("/posts", async (req, res) => {
  const { title, content, author } = req.body;
  await createPost(title, content, author);
  res.json(posts);
});

app.patch("/posts/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { title, content, author } = req.body;
  const date = new Date();
  await editPost(id, title, content, author, date);
  res.json(posts);
});

app.delete("/posts/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await deletePost(id);
  res.json(posts);
});

app.delete("/delete/all", async (req, res) => {
  await deleteAll();
  res.json(posts);
});

// ------------------- Frontend Routes -----------------------

app.get("/", async (req, res) => {
  await getPosts();
  res.render("index", { posts });
});

app.get("/new", (req, res) => {
  res.render("modify", { heading: "New Post", submit: "Create Post" });
});

app.get("/edit/:id", async (req, res) => {
  const post = await findPost(parseInt(req.params.id));
  res.render("modify", { heading: "Edit Post", submit: "Update Post", post });
});

// ------------------- Form Actions -----------------------

app.post("/api/posts", async (req, res) => {
  const { title, content, author } = req.body;
  await createPost(title, content, author);
  res.redirect("/");
});

app.post("/api/posts/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { title, content, author } = req.body;
  await editPost(id, title, content, author, new Date());
  res.redirect("/");
});

app.get("/api/posts/delete/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await deletePost(id);
  res.redirect("/");
});

app.get("/api/delete/all", async (req, res) => {
  await deleteAll();
  res.redirect("/");
});

// ------------------- Server -----------------------

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
