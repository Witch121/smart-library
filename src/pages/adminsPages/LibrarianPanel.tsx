import React, { useState, useEffect, ChangeEvent } from "react";
import { db } from "../../firebase/firebase";
import { collection, addDoc } from "firebase/firestore";
import Papa from "papaparse";
import { useAuth } from "../components/userInfo";
import { useNavigate } from "react-router-dom";

interface BookData {
  title: string;
  author: string;
  genres: string[];
  year: string;
  publisher: string;
  language: string;
  availability: boolean;
}

const LibrarianPanel: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const { user, adminData } = useAuth();
  const navigate = useNavigate();

  // Initialize book data state with types
  const [bookData, setBookData] = useState<BookData>({
    title: "",
    author: "",
    year: "",
    language: "",
    publisher: "",
    genres: [],
    availability: true,
  });

  // Handle input changes for manual book addition
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;

    setBookData((prevData) => ({
      ...prevData,
      [name]: name === "genres" ? value.split(",").map((g) => g.trim()) : value,
      availability: name === "availability" ? value === "true" : prevData.availability,
    }));
  };

    // Upload a manually entered book to Firestore
    const addBook = async () => {
      if (!adminData) {
        setMessage("User ia not admin, adding is not allowed.");
        return;
      }
  
      try {
        await addDoc(collection(db, "books"), bookData);
        setMessage(`Book "${bookData.title}" added to database`);
        setFormSubmitted(true);
      } catch (error) {
        console.error("Error adding book:", error);
      }
    };
  
    const resetForm = () => {
      setBookData({
        title: "",
        author: "",
        year: "",
        language: "",
        publisher: "",
        genres: [],
        availability: true,
      });
      setFormSubmitted(false);
      setMessage("");
    };
  
    const goHome = () => {
      navigate("/");
    };

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
        const books = result.data.slice(1) as string[][];  // Ignore CSV header
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
              availability: true,
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
      {!formSubmitted ? (
        <>
          {message && <p>{message}</p>}
          <h2 className="form-title">Librarian Panel</h2>
          <form onSubmit={(e) => e.preventDefault()} className="form-container addBookContainer">
              {[{ name: "title", label: "Title", type: "text", placeholder: "Title" },
                { name: "author", label: "Author", type: "text", placeholder: "Author" },
                { name: "genres", label: "Genres", type: "text", placeholder: "Genres (comma separated)" },
                { name: "year", label: "Year", type: "text", placeholder: "Year", min: "0"  },
                { name: "publisher", label: "Publisher", type: "text", placeholder: "Publisher"},
                { name: "language", label: "Language", type: "text", placeholder: "Language" },
              ].map(({ name, label, type, placeholder, ...rest }) => (
                <div key={name} >
                  <label htmlFor={name} className="form-label">
                    {label}
                  </label>
                  <input
                    type={type}
                    name={name}
                    className="input-field"
                    value={bookData[name as keyof BookData] as string}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    {...rest}
                  />
                </div>
              ))}

              <div>
                <label htmlFor="availability" className="form-label">
                  Avaliability
                </label>
                <select
                  name="availability"
                  className="input-field"
                  value={bookData.availability ? "true" : "false"}
                  onChange={handleInputChange}
                  required
                >
                  <option value="true">Available</option>
                  <option value="false">Unavailable</option>
                </select>
              </div>

              <button type="button" onClick={addBook} className="submit-btn">Add Book to Library</button>
              <button type="button" onClick={resetForm} className="submit-btn">Clear Form</button>
          </form>

          <div className="form-container">
            <h2>Upload Books via CSV</h2>
            <input type="file" accept=".csv" onChange={handleFileChange} />
            <button onClick={handleUpload} disabled={uploading} className="btn">
              {uploading ? "Uploading..." : "Upload CSV"}
            </button>
          </div>
        </>
      ) : (
        <div className="form-container">
          <h2>{message}</h2>
          <div className='btn_signOut_row'>
            <button onClick={resetForm} className="submit-btn">Add More</button>
            <button onClick={goHome} className="submit-btn">Home</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibrarianPanel;
