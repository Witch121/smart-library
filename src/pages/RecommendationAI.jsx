import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import { collection, getDocs } from "firebase/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";

const AIRecommend = () => {
  const [bookTitle, setBookTitle] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [books, setBooks] = useState([]);

  //Fetch books from Firestore
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "books"));
        const bookList = querySnapshot.docs.map(doc => doc.data().title);
        setBooks(bookList);
      } catch (err) {
        console.error("Error fetching books:", err);
      }
    };
    fetchBooks();
  }, []);

  const handleAIRequest = async () => {
    if (!bookTitle) {
      setError("Please enter a book title.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      //Initialize Gemini AI
      const genAI = new GoogleGenerativeAI("AIzaSyA_nYOGaXgdiOPDzd8yGgDS3iSPmzDj2Nk");
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      //Generate response from Gemini AI
      const prompt = `Given the book "${bookTitle}", recommend 3 similar books from this list: ${books.join(", ")}. Only return book titles, no explanations.`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      //Parse the response and update the state
      setRecommendations(text.split("\n").filter(book => book.trim() !== ""));
    } catch (err) {
      console.error("Error fetching AI recommendations:", err);
      setError("Failed to generate recommendations.");
    }

    setLoading(false);
  };

  return (
    <div className="container">
      <h1>AI Book Recommendations</h1>
      <input
        className="input-text-ai"
        type="text"
        placeholder="Enter a book title..."
        value={bookTitle}
        onChange={(e) => setBookTitle(e.target.value)}
      />
      <button onClick={handleAIRequest} disabled={loading} className="btn">
        {loading ? "Generating..." : "Get Recommendations"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <ul>
        {recommendations.map((book, index) => (
          <li key={index}>{book}</li>
        ))}
      </ul>
    </div>
  );
};

export default AIRecommend;
