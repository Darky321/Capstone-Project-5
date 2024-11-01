import express from "express";
import bodyParser from "body-parser";
import Pool from "pg";
import axios from "axios";

// Set up the Express app and PostgreSQL connection pool
const app = express();
const port = 3000;

var author;

const pool = new Pool.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "Darkspeed743",
  port: 5432,
});

pool.connect();

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// Home Route (Read)
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM books");
    if (result.rows == null) {
      res.redirect("/add");
    }
    res.render("index.ejs", { books: result.rows });
  } catch (err) {
    console.error("Error trfetching books:", err);
    res.status(500).send("Server Error");
  }
});

// Add Book Form Route
app.get("/add", (req, res) => {
  res.render("add-book");
});

// Add Book (Create)
app.post("/add", async (req, res) => {
  const { title, review, rating } = req.body;

  try {
    // Fetch the cover URL from the Open Library API
    var coverUrl = await fetchCoverUrl(title);
    await pool.query(
      "INSERT INTO books (title, author, review, rating, cover_url) VALUES ($1, $2, $3, $4, $5)",
      [title, author, review, rating, coverUrl]
    );

    res.redirect("/");
  } catch (err) {
    console.error("Error adding book:", err);
    res.status(500).send("Server Error");
  }
});

// Edit Book Form Route
app.get("/edit/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("SELECT * FROM books WHERE id = $1", [id]);
    res.render("edit-book", { book: result.rows[0] });
  } catch (err) {
    console.error("Error fetching book for editing:", err);
    res.status(500).send("Server Error");
  }
});

// Update Book (Update)
app.post("/edit/:id", async (req, res) => {
  const { id } = req.params;
  const { title, author, review, rating } = req.body;

  try {
    // Fetch the cover URL from the Open Library API
    const coverUrl = await fetchCoverUrl(title);

    await pool.query(
      "UPDATE books SET title = $1, author = $2, review = $3, rating = $4, cover_url = $5 WHERE id = $6",
      [title, author, review, rating, coverUrl, id]
    );

    res.redirect("/");
  } catch (err) {
    console.error("Error updating book:", err);
    res.status(500).send("Server Error");
  }
});

// Delete Book (Delete)
app.post("/delete/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM books WHERE id = $1", [id]);
    res.redirect("/");
  } catch (err) {
    console.error("Error deleting book:", err);
    res.status(500).send("Server Error");
  }
});

// Fetch cover URL from Open Library API
async function fetchCoverUrl(title) {
  try {
    const response = await axios.get(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}`
    );
    if (response.data.docs.length > 0) {
      author = response.data.docs[0].author_name;
      const coverId = response.data.docs[0].cover_i;
      return coverId
        ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
        : null;
    }
    return null;
  } catch (error) {
    console.error("Error fetching cover URL:", error);
    return null;
  }
}

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
