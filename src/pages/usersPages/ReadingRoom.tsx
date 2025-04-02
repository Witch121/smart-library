import React, { useEffect, useState } from "react";
import { useAuth } from "../components/userInfo";
import { db } from "../../firebase/firebase";
import { getDoc, doc, writeBatch, collection, query, orderBy, getDocs, updateDoc, where} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

interface Hisoryreading { 
  bookId: string;
  title: string;
  author: string;
  feedback: string;
  notes: string;
  rating: number; 
  uid: string;
}

interface CurrentBooks {
  bookId: string;
  title: string;
  author: string;
}

const ReadingRoom: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);

  const [historyOfReading, setHistoryOfReading] = useState<Hisoryreading[]>([]);
  const [historyCount, setHistoryCount] = useState<number>(0);

  const [currentBooks, setCurrentBooks] = useState<CurrentBooks[]>([]);
  const [currentBooksCount, setCurrentBooksCount] = useState<number>(0);

  const [updatedReadBook, setUpdatedReadBook] = useState<Partial<Hisoryreading>>({});
  const [editReadBookId, setEditReadBookId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnapshot = await getDoc(userRef);
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
        
          // Fetch reading history
          const booksRef = collection(db, "booksReviewUsers");
          const q = query(booksRef, orderBy("uid"), where("uid", "==", user.uid)); // Filter by active user's UID
          const querySnapshot = await getDocs(q);
          const booksData = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              bookId: doc.id,
              title: data.title,
              author: data.author,
              feedback: data.feedback,
              notes: data.notes,
              rating: data.rating,
              uid: data.uid,
            } as Hisoryreading;
          });
      
          setHistoryOfReading(booksData);
          setHistoryCount(booksData.length || 0);

          // Fetch current books with titles
          const currentBookIds = userData?.currentBook || [];
          const currentBooksWithTitles = await Promise.all(
            currentBookIds.map(async (bookId: string) => {
              const bookRef = doc(db, "books", bookId);
              const bookSnapshot = await getDoc(bookRef);
              if (bookSnapshot.exists()) {
                const bookData = bookSnapshot.data();
                return {
                  bookId,
                  title: bookData?.title || "Unknown Title",
                  author: bookData?.author || "Unknown Author",
                };
              }
              return { bookId, title: "Unknown Title" };
            })
          );

          setCurrentBooks(currentBooksWithTitles);
          setCurrentBooksCount(currentBooksWithTitles.length || 0);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchUserData();
  }, [user]);

  const handleEditClick = (book: Hisoryreading) => {
    setEditReadBookId(book.bookId);
    setUpdatedReadBook({ ...book });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
  
    if (name === "rating") {
      const numericValue = parseFloat(value);
      if (numericValue < 0 || numericValue > 5) {
        alert("Rating must be between 0 and 5.");
        return;
      }
    }
  
    if (["feedback", "notes", "rating"].includes(name)) {
      setUpdatedReadBook((prev) => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSaveClick = async () => {
    if (!editReadBookId) return;
    try {
      const bookRef = doc(db, "booksReviewUsers", editReadBookId);
      const updatedData = {
        feedback: updatedReadBook.feedback || "",
        notes: updatedReadBook.notes || "",
        rating: updatedReadBook.rating || 0,
      };
  
      await updateDoc(bookRef, updatedData);

      setHistoryOfReading((prevBooks) =>
        prevBooks.map((book) =>
          book.bookId === editReadBookId ? { ...book, ...updatedData } : book
        )
      );

      setEditReadBookId(null);
      alert("Book updated successfully!");
    } catch (err) {
      console.error("Error updating book: ", err);
      alert("Failed to update book. Please try again.");
    }
  };

  const handleReturnBookClick = async (book: CurrentBooks) => {
    if (!user) {
      alert("Please login to return a book.");
      navigate("/login");
      return;
    }
    try {
      const batch = writeBatch(db);
  
      const userRef = doc(db, "users", user.uid);

      // Remove the bookId from the currentBook array
      const updatedCurrentBooks = currentBooks
        .filter((b) => b.bookId !== book.bookId)
        .map((b) => b.bookId); // Keep only the bookId

      batch.update(userRef, {
        currentBook: updatedCurrentBooks, // Update Firestore with only book IDs
      });
  
      const pendingRef = doc(db, "pending", book.bookId);
      batch.set(pendingRef, {
        creatorId: user.uid,
        bookId: book.bookId,
        reason: "return",
        notes: prompt("Enter notes for the book:") || "",
        createdAt: new Date().toISOString(),
      });

      const booksReviewUsersRef = doc(db, "booksReviewUsers", book.bookId);
      batch.set(booksReviewUsersRef, {
        uid: user.uid,
        bookId: book.bookId,
        title: book.title,
        author: book.author,
        notes: prompt("Enter notes for the book:") || "",
        feedback: prompt("Enter feedback for the book:") || "",
        rating: parseFloat(prompt("Enter rating for the book:") || "0"),
        createdAt: new Date().toISOString(),
      });
  
      await batch.commit();
  
      setCurrentBooks((prevBooks) => prevBooks.filter((b) => b.bookId !== book.bookId));
      setCurrentBooksCount((prevCount) => prevCount - 1);
  
      alert("Book returned successfully!");
    } catch (error) {
      console.error("Error returning book:", error);
      alert("Failed to return book.");
    }
  };

  return (
    <div className="container">
      <h1>Reading room page</h1>
      <p>📚 Number of read  books: {historyCount}</p>
      <p>📚 Number of current books: {currentBooksCount}</p>

      {loading ? (
      <p>Loading data...</p>
      ) : (
        <>
        <h2>Reading History</h2>
        <table className="library_table reserve">
            <thead>
              <tr>
                <th>Book ID</th>
                <th>Title</th>
                <th>Author</th>
                <th>Feedback</th>
                <th>Notes</th>
                <th>Rating</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {historyOfReading.map((book) => (
                <tr key={book.bookId}>
                  <td>{book.bookId}</td>
                  <td>{book.title}</td>
                  <td>{book.author}</td>
                  <td>
                    {editReadBookId === book.bookId ? (
                      <input
                        type="text"
                        name="feedback"
                        value={updatedReadBook.feedback || ""}
                        onChange={handleInputChange}
                      />
                    ) : (
                      book.feedback
                    )}
                  </td>
                  <td>
                    {editReadBookId === book.bookId ? (
                      <input
                        type="text"
                        name="notes"
                        value={updatedReadBook.notes || ""}
                        onChange={handleInputChange}
                      />
                    ) : (
                      book.notes
                    )}
                  </td>
                  <td>
                    {editReadBookId === book.bookId ? (
                      <input
                        type="number"
                        name="rating"
                        value={updatedReadBook.rating || ""}
                        onChange={handleInputChange}
                        min="0"
                        max="5"
                      />
                    ) : (
                      book.rating
                    )}
                  </td>
                  <td>
                    {editReadBookId === book.bookId ? (
                      <button onClick={handleSaveClick} className="btn">Save</button>
                    ) : (
                      <button onClick={() => handleEditClick(book)} className="btn">Edit</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        <h2>Current Books</h2>
        <table className="library_table current">
          <thead>
            <tr>
              <th>Book ID</th>
              <th>Title</th>
              <th>Author</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentBooks.map((book) => (
              <tr key={book.bookId}>
                <td>{book.bookId}</td>
                <td>{book.title}</td>
                <td>{book.author}</td>
                <td>
                  <button onClick={() => handleReturnBookClick(book)} className="btn">Return</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </>
      )}
    </div>
  );
};

export default ReadingRoom;