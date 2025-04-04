import React, { useState, useEffect } from "react";
import { db } from "../../firebase/firebase";
import { collection, getDocs } from "firebase/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";

const AIRecommend: React.FC = () => {
  const [bookTitle, setBookTitle] = useState<string>("");
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [error, setError] = useState<string>("");
  const [books, setBooks] = useState<string[]>([]);

  // Access the API key from the environment variable
  const apiKey = process.env.REACT_APP_Gemini_API_KEY;

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "books"));
        const bookList = querySnapshot.docs.map((doc) => doc.data().title as string);
        setBooks(bookList);
      } catch (err) {
        console.error("Error fetching books:", err);
      }
    };
    fetchBooks();
  }, []);

  const handleAIRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bookTitle) {
      setError("Please enter a book title.");
      return;
    }

    if (!apiKey) {
      setError("API key is not configured.");
      return;
    }

    setError("");

    try {
      //Initialize Gemini AI
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Given the book "${bookTitle}", recommend 3 similar books from this list: ${books.join(", ")}. Only return book titles, no explanations.`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      setRecommendations(text.split("\n").filter((book) => book.trim() !== ""));
    } catch (err) {
      console.error("Error fetching AI recommendations:", err);
      setError("Failed to generate recommendations.");
    }
  };

  return (
    <div className="container">
      <h1>AI Book Recommendations</h1>
      <form onSubmit={handleAIRequest} className="form-container">
        <input
          className="input-field ai-recommend"
          type="text"
          placeholder="Enter a book title..."
          value={bookTitle}
          onChange={(e) => setBookTitle(e.target.value)}
        />
        <button type="submit" className="submit-btn">Get Recommendations</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <table className="library_table">
        <thead>
          <tr>
            <th>Recommended Books</th>
          </tr>
        </thead>
        <tbody>
          {recommendations.length > 0 ? (
            recommendations.map((book, index) => (
              <tr key={index}>
                <td>{book}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td>No recommendations yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AIRecommend;