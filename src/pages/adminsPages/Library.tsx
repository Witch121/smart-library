import React, { useEffect, useState } from "react";
import { useAuth } from "../components/userInfo";
import { db } from "../../firebase/firebase";
import { collection, query, getDocs, orderBy, updateDoc, doc, writeBatch, setDoc} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

interface Book {
  id: string;
  title: string;
  author: string;
  genres: string[];
  year: number;
  publisher: string;
  language: string;
  availability: boolean;
}
  
interface ReservationData {
  bookId: string;
  uid: string;
  title: string;
  reservedAt: string;
  availability: boolean;
}

const Library: React.FC = () => {
  const { adminData, user } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filter, setFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("title");
  const [loading, setLoading] = useState<boolean>(true);
  const [updatedBook, setUpdatedBook] = useState<Partial<Book>>({});
  const [editBookId, setEditBookId] = useState<string | null>(null);
  const [showReservationForm, setShowReservationForm] = useState<boolean>(false);  
  const [reservationData, setReservationData] = useState<Partial<ReservationData>>({});
  const [availableBooksCount, setAvailableBooksCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const booksPerPage = 20;


  useEffect(() => {
    const fetchBooks = async () => {
      if (!adminData) return;
      setLoading(true);
      try {
        const booksRef = collection(db, "books");
        const q = query(booksRef, orderBy(sortBy));
        const querySnapshot = await getDocs(q);
        const booksData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            author: data.author,
            genres: data.genres,
            year: data.year,
            publisher: data.publisher,
            language: data.language,
            availability: data.availability ?? data.avaliability ?? true, // Normalize field
          } as Book;
        });
    
        setBooks(booksData);
    
        const availableCount = booksData.filter((book) => book.availability).length;
        setAvailableBooksCount(availableCount);
      } catch (error) {
        console.error("Error fetching books: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [sortBy, adminData]);

  const handleEditClick = (book: Book) => {
    setEditBookId(book.id);
    setUpdatedBook({ ...book });
  };

  const handleReserveClick = (book: Book) => {
  
    // Prepare reservation details
    const reservationDetails = {
      bookId: book.id,
      title: book.title,
      uid: adminData?.isAdmin ? "" : user?.uid, // Auto-fill UID if user, leave empty for admin selection
      reservedAt: new Date().toISOString(),
      availability: false, // Mark as unavailable
    };
  
    setReservationData(reservationDetails);
    setShowReservationForm(true);
  };
  
  const handleConfirmReservation = async () => {
    if (!reservationData?.bookId || !reservationData?.uid) {
      alert("Please enter a valid user ID");
      return;
    }
  
    try {
      const batch = writeBatch(db);
  
      // Add reservation to 'reserve' collection
      const reserveRef = doc(db, "reserve", reservationData.bookId);
      batch.set(reserveRef, reservationData);
  
      // Update book's availability in Firestore
      const bookRef = doc(db, "books", reservationData.bookId);
      batch.update(bookRef, { availability: false });
  
      // Update user's 'reservedBooks' field in Firestore
      const userRef = doc(db, "users", reservationData.uid);
      const userSnapshot = await getDocs(query(collection(db, "users"), orderBy("uid")));
  
      if (userSnapshot) {
        const userData = userSnapshot.docs.find((doc) => doc.id === reservationData.uid)?.data();
        const existingReservedBooks = userData?.reservedBooks || [];
  
        batch.update(userRef, {
          reservedBooks: [...existingReservedBooks, reservationData.bookId],
        });
      }
  
      // Commit the batch to Firestore
      await batch.commit();
  
      // Update the state to reflect availability change
      setBooks((prevBooks) =>
        prevBooks.map((book) =>
          book.id === reservationData.bookId ? { ...book, availability: false } : book
        )
      );
  
      alert("Book reserved successfully!");
      setShowReservationForm(false);
    } catch (error) {
      console.error("Error reserving book:", error);
      alert("Failed to reserve book.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUpdatedBook((prev) => ({ ...prev, [name]: value }));
  };
  const handleSaveClick = async () => {
    if (!editBookId) return;
    try {
      const bookRef = doc(db, "books", editBookId);
      const updatedData = {
        ...updatedBook,
        availability: typeof updatedBook.availability === "string" ? updatedBook.availability === "true" : updatedBook.availability,
      }; //need to reload the page to see the changes
  
      await updateDoc(bookRef, updatedData);

      setBooks((prevBooks) =>
        prevBooks.map((book) => (book.id === editBookId ? { ...book, ...updatedBook } : book))
      );
      setEditBookId(null);
    } catch (err) {
      console.error("Error updating book: ", err);
    }
  };

  const convertToCSV = (books: Book[]) => {
    const headers = ["Title", "Author", "Genre", "Language", "Publisher", "Year", "Availability"];
    const rows = books.map((book) => [
      book.title,
      book.author,
      Array.isArray(book.genres) ? book.genres.join(", ") : "N/A",
      book.language,
      book.publisher,
      book.year,
      book.availability,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    return encodeURI(csvContent);
  };

  const downloadCSV = () => {
    const csv = convertToCSV(books);
    const link = document.createElement("a");
    link.setAttribute("href", csv);
    link.setAttribute("download", "library_books.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredBooks = books.filter((book) => {
    const lowerCaseFilter = filter.toLowerCase();
    return (
      book.id.toLowerCase().includes(lowerCaseFilter) ||
      book.title.toLowerCase().includes(lowerCaseFilter) ||
      book.author.toLowerCase().includes(lowerCaseFilter) ||
      (Array.isArray(book.genres) && book.genres.some((genres) => genres.toLowerCase().includes(lowerCaseFilter))) ||
      (book.language&& book.language.toLowerCase().includes(lowerCaseFilter)) ||
      book.year.toString().toLowerCase().includes(lowerCaseFilter) ||
      book.publisher.toLowerCase().includes(lowerCaseFilter) ||
      (book.availability ? "available" : "unavailable").includes(lowerCaseFilter)
    );
  });

  const handleSearch = () => {
    setCurrentPage(1);
    setFilter(searchTerm);
    // console.log("filter: ", searchTerm);
  };
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalPages = Math.ceil(filteredBooks.length / booksPerPage);
  const paginatedBooks = filteredBooks.slice((currentPage - 1) * booksPerPage, currentPage * booksPerPage);

  return (
    <div className="container">
        <h1>Library page</h1>
        <p>📚 Available Books: {availableBooksCount}</p>
        <h2>statistics - damaged books, reserved books</h2>

        <input
          type="text"
          placeholder="I`m looking for ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button onClick={handleSearch} className="btn-table">Search</button>

        <select onChange={(e) => setSortBy(e.target.value)} value={sortBy}>
          <option value="title">Sort by Title</option>
          <option value="author">Sort by Author</option>
          <option value="genres">Sort by Genre</option>
          <option value="year">Sort by Year</option>
          <option value="language">Sort by Language</option>
          <option value="publisher">Sort by Publisher</option>
          <option value="availability">Sort by Availability</option>
        </select>

        {loading ? (
          <p>Loading your books...</p>
        ) : (
            <>
            {showReservationForm && (
              <div className="modal">
                <h2>Reserve Book</h2>
                <p>Book: {reservationData?.title}</p>
                <label>User ID:</label>
                <input
                  type="text"
                  value={reservationData?.uid || ""}
                  onChange={(e) => setReservationData((prev) => ({ ...prev, uid: e.target.value }))}
                />
                <button onClick={handleConfirmReservation} className="btn">Confirm</button>
                <button onClick={() => setShowReservationForm(false)} className="btn">Cancel</button>
              </div>
            )}
            <table className="library_table">
            <thead>
              <tr className="showLibraryTableHead">
                {["id","Title", "Author", "Genre", "Language", "Publisher", "Year", "Availability"].map((label, index) => (
                  <th key={label}>
                     {label}
                    </th>
                ))}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paginatedBooks.map((book) => (
                <tr key={book.id}>
                  {["id","title", "author", "genres", "language", "publisher", "year", "availability"].map((field) => (
                    <td key={field}>
                      {editBookId === book.id ? (
                        field === "availability" || field === "avaliability" ? (
                          <select
                            name="availability"
                            value={(updatedBook.availability ?? book.availability).toString()}
                            onChange={handleInputChange}
                          >
                            <option value="true">Available</option>
                            <option value="false">Unavailable</option>
                          </select>
                        ) : (
                          <input
                            type={field === "year" ? "number" : "text"}
                            name={field}
                            value={(updatedBook as any)[field as keyof Book] || (book as any)[field as keyof Book]}
                            onChange={handleInputChange}
                            min={field === "year" ? "0" : undefined}
                          />
                        )
                      ) : field === "genres" ? (
                        Array.isArray(book[field as keyof Book])
                          ? (book[field as keyof Book] as string[]).join(", ")
                          : "N/A"
                      ) : field === "availability" || field === "avaliability" ? (
                        book.availability ? "Available" : "Unavailable"
                      ) : (
                        book[field as keyof Book]
                      )}
                    </td>
                  ))}
                  <td>
                    {editBookId === book.id ? (
                      <button onClick={handleSaveClick} className="btn">Save</button>
                    ) : (
                      <div>
                        <button onClick={() => handleEditClick(book)} className="btn"> Edit
                        </button>
                        <button onClick={() => handleReserveClick(book)} className="btn"> Reserve
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
            <div className="pagination">
              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index + 1}
                  onClick={() => handlePageChange(index + 1)}
                  className={currentPage === index + 1 ? "active" : ""}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </>
        )}

      <button onClick={downloadCSV} className="btn">Download as CSV</button>
    </div>
  );
};

export default Library;