import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../components/userInfo";
import { db } from "../../firebase/firebase";
import { collection, query, getDocs, getDoc, orderBy, updateDoc, doc, writeBatch, limit, startAt } from "firebase/firestore";
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

const TakeBook: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [books, setBooks] = useState<Book[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [filter, setFilter] = useState<string>("");
    const [sortBy, setSortBy] = useState<string>("title");
    const [loading, setLoading] = useState<boolean>(true);
    const [reservationData, setReservationData] = useState<Partial<ReservationData>>({});
    const [availableBooksCount, setAvailableBooksCount] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const booksPerPage = 20;

    useEffect(() => {
      const fetchBooks = async () => {
        if (!user) return; // Ensure the user is authenticated
        setLoading(true); // Set loading to true before starting the fetch
        try {
          // Fetch all books to calculate the total number of available books
          const allBooksRef = collection(db, "books");
          const allBooksSnapshot = await getDocs(allBooksRef);
          const allBooksData = allBooksSnapshot.docs.map((doc) => {
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
    
          // Calculate the total number of available books
          const availableCount = allBooksData.filter((book) => book.availability).length;
          setAvailableBooksCount(availableCount);
    
          // Fetch only the books for the current page
          const booksRef = collection(db, "books");
          const q = query(
            booksRef,
            orderBy(sortBy),
            limit(booksPerPage), // Fetch only the required number of books
            startAt((currentPage - 1) * booksPerPage) // Pagination
          );
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
        } catch (error) {
          console.error("Error fetching books: ", error);
        } finally {
          setLoading(false);
        }
      };
    
      fetchBooks();
    }, [sortBy, user, currentPage]);

      const handleReserveClick = async (book: Book) => {
        if (book.availability === false) {
          alert("Book is already reserved."); 
          return;
        }
          // Prepare reservation details
          const reservationDetails = {
            bookId: book.id,
            title: book.title,
            uid: user?.uid, // Auto-fill UID if user
            reservedAt: new Date().toISOString(),
            availability: false, // Mark as unavailable
          };
          
          if (!reservationDetails.bookId || !reservationDetails.uid) {
            alert("Invalid reservation details.");
            return;
          }

          try {
            const batch = writeBatch(db);
        
            // Add reservation to 'reserve' collection
            const reserveRef = doc(db, "reserve", reservationDetails.bookId);
            batch.set(reserveRef, reservationDetails);
        
            // Update book's availability in Firestore
            const bookRef = doc(db, "books", reservationDetails.bookId);
            batch.update(bookRef, { availability: false });
        
            const userRef = doc(db, "users", reservationDetails.uid);
            const userSnapshot = await getDoc(userRef);
            
            if (userSnapshot.exists()) {
              const userData = userSnapshot.data();
              const existingReservedBooks = userData?.reservedBooks || [];
            
              batch.update(userRef, {
                reservedBooks: [...existingReservedBooks, reservationDetails.bookId],
              });
            }

            // Commit the batch to Firestore
            await batch.commit();
        
            // Update the state to reflect availability change
            setBooks((prevBooks) =>
              prevBooks.map((b) =>
                b.id === reservationDetails.bookId ? { ...b, availability: false } : b
              )
            );
        
            alert("Book reserved successfully!");
          } catch (error) {
            console.error("Error reserving book:", error);
            alert("Failed to reserve book.");
          }
        };

      const handleAddtoWishlistClick = async (book: Book) => {
        if (!user) {  
          alert("Please login to add to wishlist.");
          navigate("/login");
          return;
        }
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnapshot = await getDoc(userRef);
          
          if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            const existingWishlist = userData?.wishlist || [];
          
            if (existingWishlist.includes(book.id)) {
              alert("Book already in wishlist.");
              return;
            }
          
            const updatedWishlist = [...existingWishlist, book.id];
            await updateDoc(userRef, { wishlist: updatedWishlist });
            alert("Book added to wishlist successfully!");
          }
        }
        catch (error) {  
          console.error("Error adding to wishlist: ", error);
          alert("Failed to add book to wishlist.");
        }
      };

      const filteredBooks = useMemo(() => {
        const lowerCaseFilter = filter.toLowerCase();
        return books.filter((book) => {
          return (
            book.id?.toLowerCase().includes(lowerCaseFilter) ||
            book.title?.toLowerCase().includes(lowerCaseFilter) ||
            book.author?.toLowerCase().includes(lowerCaseFilter) ||
            (Array.isArray(book.genres) && book.genres.some((genre) => genre?.toLowerCase().includes(lowerCaseFilter))) ||
            book.language?.toLowerCase().includes(lowerCaseFilter) ||
            book.year?.toString().toLowerCase().includes(lowerCaseFilter) ||
            book.publisher?.toLowerCase().includes(lowerCaseFilter) ||
            (book.availability ? "available" : "unavailable").includes(lowerCaseFilter)
          );
        });
      }, [books, filter]);

      const handleSearch = () => {
        setCurrentPage(1);
        setFilter(searchTerm);
        // console.log("filter: ", searchTerm);
      };
      const handlePageChange = (page: number) => {
        setCurrentPage(page);
      };

      const totalPages = Math.ceil(availableBooksCount / booksPerPage);
      const paginatedBooks = useMemo(() => {
        return filteredBooks.slice(
          (currentPage - 1) * Math.max(booksPerPage, 1),
          currentPage * Math.max(booksPerPage, 1)
        );
      }, [filteredBooks, currentPage, booksPerPage]);

  return (
    <div className="container">
        <h1>Take Book from Library</h1>
        <p>📚 Available Books: {availableBooksCount}</p>

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
          <p>Loading avaliable books...</p>
        ) : (
            <>
                <table className="library_table">
                <thead>
                  <tr className="showLibraryTableHead">
                    {["Title", "Author", "Genre", "Language", "Publisher", "Year", "Availability"].map((label, index) => (
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
                      {["title", "author", "genres", "language", "publisher", "year", "availability"].map((field) => (
                        <td key={field}>
                          {field === "availability" || field === "avaliability" ? (
                            book.availability ? "Available" : "Unavailable"
                          ) : (
                            field === "genres" ? book.genres.join(", ") : book[field]
                          )}
                        </td>
                      ))}
                      <td>
                        <div>
                          <button onClick={() => handleAddtoWishlistClick(book)} className="btn"> Add to wishlist 
                          </button>
                          <button onClick={() => handleReserveClick(book)} className="btn"> Reserve
                          </button>
                        </div>
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
    </div>
  );
};

export default TakeBook;