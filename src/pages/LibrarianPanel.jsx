import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import { collection, addDoc } from "firebase/firestore";
import Papa from "papaparse";
import { useAuth } from "./components/userInfo";
import { useNavigate } from "react-router-dom";

const LibrarianPanel = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const { user, adminData } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !adminData) {
      //console.log("user in libr panel:", user.uid, "isAdmin in libr panel:", adminData);
      navigate("/");
    }
  }, [user, adminData, navigate]);

  if (!user || !adminData) {
    return <p>Redirecting...</p>;
  }
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a CSV file.");
      return;
    }

    setUploading(true);
    setError("");

    Papa.parse(file, {
      complete: async (result) => {
        const books = result.data.slice(1); // Ignore header row
        const bookCollection = collection(db, "books");

        try {
          const uploadPromises = books.map(async (row, index) => {
            if (!Array.isArray(row) || row.length < 7) {
              console.warn(`Skipping row ${index + 2}: Invalid row format`, row);
              return;
            }
          
            let [title, author, genres, year, publisher, language] = row;

            // Check if any field is undefined or empty
            if (![title, author, genres, year, publisher, language].every((field) => field && field.trim() !== "")) {
              console.warn(`Skipping row ${index + 2}: Missing values`, row);
              return;
            }
  
            // Trim & Parse Values
            title = title.trim();
            author = author.trim();
            genres = genres ? genres.split(",").map((g) => g.trim()) : [];
            year = /^\d{4}$/.test(year.trim()) ? parseInt(year.trim()) : year.trim();
            publisher = publisher.trim();
            language = language.trim();
  
            await addDoc(bookCollection, { title, author, genres, year, publisher, language });
          });
  
          await Promise.all(uploadPromises);
          alert("Books uploaded successfully!");
        } catch (err) {
          console.error("Error uploading books:", err);
          setError("Failed to upload books.");
        }
  
        setUploading(false);
      },
      header: false,
      skipEmptyLines: true,
    });
  };

  return (
    <div className="container">
      <h1>Librarian Panel</h1>
      <h3>Upload Books via CSV</h3>
      <input type="file" accept=".csv" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={uploading} className="btn">
        {uploading ? "Uploading..." : "Upload CSV"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default LibrarianPanel;
