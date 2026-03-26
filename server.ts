import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("library.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    name TEXT,
    role TEXT DEFAULT 'reader'
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    slug TEXT UNIQUE
  );

  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    author TEXT,
    description TEXT,
    cover_url TEXT,
    category_id INTEGER,
    status TEXT DEFAULT 'available',
    FOREIGN KEY(category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER,
    user_id INTEGER,
    loaned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    returned_at DATETIME,
    FOREIGN KEY(book_id) REFERENCES books(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER,
    user_id INTEGER,
    rating INTEGER,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(book_id) REFERENCES books(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS waitlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(book_id) REFERENCES books(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS conversion_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cta_name TEXT,
    clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed initial data if empty
const bookCount = db.prepare("SELECT COUNT(*) as count FROM books").get() as { count: number };
if (bookCount.count === 0) {
  const categories = ['Fiction', 'Science', 'History', 'Technology', 'Philosophy'];
  const insertCategory = db.prepare("INSERT INTO categories (name, slug) VALUES (?, ?)");
  categories.forEach(c => insertCategory.run(c, c.toLowerCase()));

  const insertBook = db.prepare("INSERT INTO books (title, author, description, cover_url, category_id) VALUES (?, ?, ?, ?, ?)");
  insertBook.run("The Great Gatsby", "F. Scott Fitzgerald", "A classic novel about the American Dream.", "https://picsum.photos/seed/gatsby/400/600", 1);
  insertBook.run("A Brief History of Time", "Stephen Hawking", "Exploring the origins of the universe.", "https://picsum.photos/seed/hawking/400/600", 2);
  insertBook.run("Clean Code", "Robert C. Martin", "A handbook of agile software craftsmanship.", "https://picsum.photos/seed/cleancode/400/600", 4);
  insertBook.run("Meditations", "Marcus Aurelius", "Stoic philosophy from a Roman Emperor.", "https://picsum.photos/seed/meditations/400/600", 5);
  insertBook.run("Sapiens", "Yuval Noah Harari", "A brief history of humankind.", "https://picsum.photos/seed/sapiens/400/600", 3);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/books", (req, res) => {
    const search = req.query.search as string;
    let books;
    if (search) {
      books = db.prepare("SELECT b.*, c.name as category_name FROM books b JOIN categories c ON b.category_id = c.id WHERE b.title LIKE ? OR b.author LIKE ?").all(`%${search}%`, `%${search}%`);
    } else {
      books = db.prepare("SELECT b.*, c.name as category_name FROM books b JOIN categories c ON b.category_id = c.id").all();
    }
    res.json(books);
  });

  app.get("/api/books/trending", (req, res) => {
    const books = db.prepare("SELECT b.*, c.name as category_name FROM books b JOIN categories c ON b.category_id = c.id LIMIT 3").all();
    res.json(books);
  });

  app.post("/api/track", (req, res) => {
    const { cta_name } = req.body;
    db.prepare("INSERT INTO conversion_tracking (cta_name) VALUES (?)").run(cta_name);
    res.json({ success: true });
  });

  app.post("/api/books/:id/borrow", (req, res) => {
    const bookId = req.params.id;
    const userId = 1; // Mock user for now
    
    const book = db.prepare("SELECT status FROM books WHERE id = ?").get(bookId) as { status: string };
    
    if (book.status === 'available') {
      db.prepare("UPDATE books SET status = 'loaned' WHERE id = ?").run(bookId);
      db.prepare("INSERT INTO loans (book_id, user_id) VALUES (?, ?)").run(bookId, userId);
      res.json({ success: true, message: "Book borrowed successfully" });
    } else {
      db.prepare("INSERT INTO waitlist (book_id, user_id) VALUES (?, ?)").run(bookId, userId);
      res.json({ success: true, message: "Added to waitlist" });
    }
  });

  app.get("/api/admin/stats", (req, res) => {
    const stats = db.prepare("SELECT cta_name, COUNT(*) as count FROM conversion_tracking GROUP BY cta_name").all();
    const totalLoans = db.prepare("SELECT COUNT(*) as count FROM loans").get() as { count: number };
    const totalWaitlist = db.prepare("SELECT COUNT(*) as count FROM waitlist").get() as { count: number };
    res.json({ stats, totalLoans: totalLoans.count, totalWaitlist: totalWaitlist.count });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
