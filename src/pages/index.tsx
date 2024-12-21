import { useState, useEffect } from "react";
import type { NextPage } from "next";
import Head from "next/head";

interface Book {
  id: number;
  title: string;
  author: string;
  year: number;
}

interface FormData {
  title: string;
  author: string;
  year: string;
}

const Home: NextPage = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    author: "",
    year: "",
  });
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await fetch("/api/books");
      if (!response.ok) throw new Error("Failed to fetch books");
      const data = await response.json();
      setBooks(data);
      setError("");
    } catch (error) {
      setError("Error fetching books");
      console.error("Error:", error);
    }
  };

  const handleEdit = (book: Book) => {
    setSelectedBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      year: book.year.toString(),
    });
    setEditMode(true);
    setError("");
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      if (!selectedBook) return;

      const response = await fetch(`/api/books/${selectedBook.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          author: formData.author,
          year: parseInt(formData.year),
        }),
      });

      if (!response.ok) throw new Error("Failed to update book");

      setEditMode(false);
      setSelectedBook(null);
      setError("");
      await fetchBooks();
    } catch (error) {
      setError("Error updating book");
      console.error("Error:", error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/books/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete book");

      setError("");
      await fetchBooks();
    } catch (error) {
      setError("Error deleting book");
      console.error("Error:", error);
    }
  };

  return (
    <>
      <Head>
        <title>Book Management</title>
        <meta name="description" content="Book Management System" />
      </Head>

      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Book Management</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {editMode && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Edit Book</h2>
            <form onSubmit={handleUpdate} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Author
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) =>
                    setFormData({ ...formData, author: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Year
                </label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
                  required
                />
              </div>
              <div className="space-x-2">
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <div
              key={book.id}
              className="border rounded-lg shadow-sm p-4 hover:shadow-md transition"
            >
              <h3 className="font-bold text-lg">{book.title}</h3>
              <p className="text-gray-600">Author: {book.author}</p>
              <p className="text-gray-600">Year: {book.year}</p>
              <div className="mt-4 space-x-2">
                <button
                  onClick={() => handleEdit(book)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(book.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Home;
