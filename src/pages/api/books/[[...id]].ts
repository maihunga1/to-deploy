import type { NextApiRequest, NextApiResponse } from 'next';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

interface Book {
  id: number;
  title: string;
  author: string;
  year: number;
}

// Initialize SQLite database
const dbPath = path.resolve(process.cwd(), 'data', 'books.db');

// Ensure database directory exists
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

// Initialize database connection
const db = new Database(dbPath);

// Create books table
db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    year INTEGER NOT NULL
  )
`);

// Insert initial data if table is empty
const count = db.prepare('SELECT COUNT(*) as count FROM books').get() as { count: number };

if (count.count === 0) {
  const fakeBooks = [
    { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', year: 1925 },
    { title: '1984', author: 'George Orwell', year: 1949 },
    { title: 'To Kill a Mockingbird', author: 'Harper Lee', year: 1960 },
  ];

  const insert = db.prepare('INSERT INTO books (title, author, year) VALUES (?, ?, ?)');
  for (const book of fakeBooks) {
    insert.run(book.title, book.author, book.year);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const id = req.query.id ? Number(req.query.id[0]) : null;

  if (id && isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  switch (method) {
    case 'GET':
      try {
        if (id) {
          const book = db.prepare('SELECT * FROM books WHERE id = ?').get(id) as Book | undefined;
          if (!book) {
            return res.status(404).json({ error: 'Book not found' });
          }
          return res.status(200).json(book);
        } else {
          const books = db.prepare('SELECT * FROM books').all() as Book[];
          return res.status(200).json(books);
        }
      } catch (error) {
        console.error('Error fetching books:', error);
        return res.status(500).json({ error: 'Failed to fetch books' });
      }

    case 'PUT':
      try {
        if (!id) {
          return res.status(400).json({ error: 'Missing book ID' });
        }

        const { title, author, year } = req.body;

        if (!title || !author || !year) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = db.prepare(
          'UPDATE books SET title = ?, author = ?, year = ? WHERE id = ?'
        ).run(title, author, year, id);

        if (result.changes === 0) {
          return res.status(404).json({ error: 'Book not found' });
        }

        const updatedBook = db.prepare('SELECT * FROM books WHERE id = ?').get(id);
        return res.status(200).json(updatedBook);
      } catch (error) {
        console.error('Error updating book:', error);
        return res.status(500).json({ error: 'Failed to update book' });
      }

    case 'DELETE':
      try {
        if (!id) {
          return res.status(400).json({ error: 'Missing book ID' });
        }

        const result = db.prepare('DELETE FROM books WHERE id = ?').run(id);

        if (result.changes === 0) {
          return res.status(404).json({ error: 'Book not found' });
        }

        return res.status(204).end();
      } catch (error) {
        console.error('Error deleting book:', error);
        return res.status(500).json({ error: 'Failed to delete book' });
      }

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}