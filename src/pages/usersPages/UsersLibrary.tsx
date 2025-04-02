import React, { useEffect, useState } from "react";
import { useAuth } from "../components/userInfo";
import { db } from "../../firebase/firebase";
import { getDoc, doc, writeBatch, updateDoc} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

interface ActiveReservation {
  bookId: string;
  title: string;
  uid: string;
}

interface Wishlist {
  bookId: string;
  title: string;
  author: string;
}
const UsersLibrary: React.FC = () => {
  const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState<boolean>(true);
    const [reservedBooks, setReservedBooks] = useState<ActiveReservation[]>([]);
    const [reservedBooksCount, setReservedBooksCount] = useState<number>(0);
    const [wishlist, setWishlist] = useState<Wishlist[]>([]);
    const [wishlistCount, setWishlistCount] = useState<number>(0);

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
            
              // Fetch reserved books with titles
              const reservedBookIds = userData?.reservedBooks || [];
              const reservedBooksWithTitles = await Promise.all(
                reservedBookIds.map(async (bookId: string) => {
                  const bookRef = doc(db, "books", bookId);
                  const bookSnapshot = await getDoc(bookRef);
                  if (bookSnapshot.exists()) {
                    const bookData = bookSnapshot.data();
                    return {
                      bookId,
                      title: bookData?.title || "Unknown Title",
                    };
                  }
                  return { bookId, title: "Unknown Title" }; // Fallback if book not found
                })
              );
    
              setReservedBooks(reservedBooksWithTitles);
              setReservedBooksCount(reservedBooksWithTitles.length || 0);
    
              // Fetch wishlist with titles and authors
              const wishlistBookIds = userData?.wishlist || [];
              const wishlistBooksWithTitles = await Promise.all(
                wishlistBookIds.map(async (bookId: string) => {
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
                  return { bookId, title: "Unknown Title" }; // Fallback if book not found
                })
              );
    
              setWishlist(wishlistBooksWithTitles);
              setWishlistCount(wishlistBooksWithTitles.length || 0);
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
          } finally {
            setLoading(false);
          }
        };
      
        fetchUserData();
      }, [user]);

      const handleUnreserveClick = async (book: ActiveReservation) => {
        if (!user) {
          alert("Please login to unreserve a book.");
          navigate("/login");
          return;
        }
        try {
          const batch = writeBatch(db);
      
          // Reference to the user's document
          const userRef = doc(db, "users", user.uid);
      
          // Remove the bookId from the reservedBooks array
          const updatedReservedBooks = reservedBooks
            .filter((b) => b.bookId !== book.bookId)
            .map((b) => b.bookId); // Keep only the bookId
      
          batch.update(userRef, {
            reservedBooks: updatedReservedBooks, // Update Firestore with only book IDs
          });
      
          // Delete the document from the reserve collection
          const reserveRef = doc(db, "reserve", book.bookId);
          batch.delete(reserveRef);
      
          // Mark the book as available in the books collection
          const bookRef = doc(db, "books", book.bookId);
          batch.update(bookRef, {
            availability: true,
          });
      
          // Commit the batch
          await batch.commit();
      
          // Update the state
          setReservedBooks((prevBooks) => prevBooks.filter((b) => b.bookId !== book.bookId));
          setReservedBooksCount((prevCount) => prevCount - 1);
      
          alert("Book unreserved successfully!");
        } catch (error) {
          console.error("Error unreserving book:", error);
          alert("Failed to unreserve book.");
        }
      };

      const handleUnwishClick = async (book: Wishlist) => {
        if (!user) {
          alert("Please login to manage your wishlist.");
          navigate("/login");
          return;
        }
      
        try {
          // Reference to the user's document
          const userRef = doc(db, "users", user.uid);
      
          // Remove the bookId from the wishlist array
          const updatedWishlist = wishlist
            .filter((b) => b.bookId !== book.bookId)
            .map((b) => b.bookId); // Keep only the bookId
      
          // Update Firestore with the updated wishlist
          await updateDoc(userRef, {
            wishlist: updatedWishlist,
          });

          //using Firestore's arrayRemove operation to remove the bookId directly:
          // await updateDoc(userRef, {
          //   wishlist: arrayRemove(book.bookId),
          // });
      
          // Update the state
          setWishlist(updatedWishlist.map((id) => ({ bookId: id, title: "", author: "" }))); // Reset title and author
          setWishlistCount((prevCount) => prevCount - 1);
      
          alert("Book deleted from wishlist successfully!");
        } catch (error) {
          console.error("Error deleting book from wishlist:", error);
          alert("Failed to delete book from wishlist. Please try again.");
        }
      };

  return (
    <div className="container">
        <h1>Users Library page</h1>
        <p>📚 Number of reserved books: {reservedBooksCount}</p>
        <p>📚 Number of books in wishlist: {wishlistCount}</p>

        {loading ? (
      <p>Loading data...</p>
      ) : (
        <>
        <h2>Reserved Books</h2>
        <table className="library_table reserve">
            <thead>
              <tr>
                <th>Book ID</th>
                <th>Title</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservedBooks.map((book) => (
                <tr key={book.bookId}>
                  <td>{book.bookId}</td>
                  <td>{book.title}</td>
                  <td>
                    <button onClick={() => handleUnreserveClick(book)} className="btn">Unreserve</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        <h2>Wishlist</h2>
        <table className="library_table wishlist">
          <thead>
            <tr>
              <th>Book ID</th>
              <th>Title</th>
              <th>Author</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {wishlist.map((book) => (
              <tr key={book.bookId}>
                <td>{book.bookId}</td>
                <td>{book.title}</td>
                <td>{book.author}</td>
                <td>
                  <button onClick={() => handleUnwishClick(book)} className="btn">Delte from wishlist</button>
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

export default UsersLibrary;