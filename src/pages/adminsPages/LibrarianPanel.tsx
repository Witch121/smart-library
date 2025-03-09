import React, { useState, useEffect, ChangeEvent } from "react";
import { db } from "../../firebase/firebase";
import { collection, addDoc } from "firebase/firestore";
import Papa from "papaparse";
import { useAuth } from "../components/userInfo";
import { useNavigate } from "react-router-dom";

const LibrarianPanel: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>("");
  const { user, adminData } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !adminData) {
      navigate("/");
    }
  }, [user, adminData, navigate]);

  if (!user || !adminData) {
    return <p>Redirecting...</p>;
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
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
        const books = result.data.slice(1) as string[][];
        const bookCollection = collection(db, "books");

        try {
          const uploadPromises = books.map(async (row, index) => {
            if (!Array.isArray(row) || row.length < 6) {
              console.warn(`Skipping row ${index + 2}: Invalid row format`, row);
              return;
            }

            let [title, author, genres, year, publisher, language] = row.map((field) => field.trim());

            if (![title, author, genres, year, publisher, language].every((field) => field)) {
              console.warn(`Skipping row ${index + 2}: Missing values`, row);
              return;
            }

            const parsedYear = /^\d{4}$/.test(year) ? parseInt(year, 10) : year;

            await addDoc(bookCollection, {
              title,
              author,
              genres: genres.split(",").map((g) => g.trim()),
              year: parsedYear,
              publisher,
              language,
            });
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
