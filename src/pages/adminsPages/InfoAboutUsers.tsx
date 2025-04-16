import React, { useEffect, useState } from "react";
import { useAuth } from "../components/userInfo";
import { db } from "../../firebase/firebase";
import { collection, query, getDocs, orderBy, updateDoc, doc, getDoc} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
//add delete user func
interface User {
  id: string;
  nickname: string;
  email: string;
  reservedBooks: string[];
  reservedBooksTitles: { bookId: string; title: string }[];
  currentBook: string[];
  currentBooksTitles: { bookId: string; title: string }[];
  notes: string;
  allowedToUseLibrary: boolean;
  lastSession: string;
}

const InfoAboutUsers: React.FC = () => {
  const { adminData } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filter, setFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("id");
  const [loading, setLoading] = useState<boolean>(true);
  const [updatedUser, setUpdatedUser] = useState<Partial<User>>({});
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [numberOfUsersCount, setNumberOfUsersCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const usersPerPage = 20;
  

  useEffect(() => {
    const fetchUsers = async () => {
      if (!adminData) return;
      setLoading(true);
  
      try {
        // Fetch users from the "users" collection
        const usersRef = collection(db, "users");
        const q = query(usersRef, orderBy(sortBy));
        const querySnapshot = await getDocs(q);
  
        const usersData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            nickname: data.nickname || "N/A",
            email: data.email || "N/A",
            reservedBooks: data.reservedBooks || [],
            currentBook: data.currentBook || [],
            notes: data.notes || "",
            allowedToUseLibrary: data.allowedToUseLibrary || true,
            lastSession: data.lastSession ? (data.lastSession.toDate ? data.lastSession.toDate().toLocaleDateString() : new Date(data.lastSession).toLocaleDateString()) : "N/A",
          } as User;
        });
  
        // Combine all book IDs (current and reserved) to fetch titles in one go
        const allBookIds = [
          ...new Set([
            ...usersData.flatMap((user) => user.currentBook || []),
            ...usersData.flatMap((user) => user.reservedBooks || []),
          ]),
        ];
  
        // Fetch all book titles from the "books" collection
        const booksWithTitles = await Promise.all(
          allBookIds.map(async (bookId: string) => {
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
  
        // Create a map of bookId to title for quick lookup
        const bookIdToTitleMap = booksWithTitles.reduce((map, book) => {
          map[book.bookId] = book.title;
          return map;
        }, {} as Record<string, string>);
  
        // Map book titles to users
        const usersWithBookTitles = usersData.map((user) => ({
          ...user,
          currentBooksTitles: user.currentBook.map((bookId) => ({
            bookId,
            title: bookIdToTitleMap[bookId] || "Unknown Title",
          })),
          reservedBooksTitles: user.reservedBooks.map((bookId) => ({
            bookId,
            title: bookIdToTitleMap[bookId] || "Unknown Title",
          })),
        }));
  
        setUsers(usersWithBookTitles);
        setNumberOfUsersCount(usersWithBookTitles.length);
      } catch (error) {
        console.error("Error fetching users: ", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchUsers();
  }, [sortBy, adminData]);

  const handleEditClick = (user: User) => {
    setEditUserId(user.id);
    setUpdatedUser({ ...user });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUpdatedUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveClick = async () => {
    if (!editUserId) return;
    try {
      const userRef = doc(db, "users", editUserId);
      const updatedData = {
        ...updatedUser,
      };

      await updateDoc(userRef, updatedData);

      setUsers((prevUsers) =>
        prevUsers.map((user) => (user.id === editUserId ? { ...user, ...updatedUser } : user))
      );
      setEditUserId(null);
    } catch (err) {
      console.error("Error updating user: ", err);
    }
  };

  const filteredUsers = users.filter((user) => {
    const lowerCaseFilter = filter.toLowerCase();
    return (
      user.nickname.toLowerCase().includes(lowerCaseFilter) ||
      user.email.toLowerCase().includes(lowerCaseFilter) ||
      user.id.toLowerCase().includes(lowerCaseFilter) ||
      user.notes.toLowerCase().includes(lowerCaseFilter) ||
      (Array.isArray(user.reservedBooks) &&
        user.reservedBooks.some((book) => book.toLowerCase().includes(lowerCaseFilter))) ||
      (Array.isArray(user.currentBook) &&
        user.currentBook.some((book) => book.toLowerCase().includes(lowerCaseFilter))) ||
      user.lastSession.toLowerCase().includes(lowerCaseFilter) ||
      user.allowedToUseLibrary.toString().toLowerCase().includes(lowerCaseFilter)
    );
  });

  const handleSearch = () => {
    setCurrentPage(1);
    setFilter(searchTerm);
  };
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

  const copyID = (id: string, type: "book" | "user") => {
    navigator.clipboard.writeText(id).then(() => {
      alert(`${type === "book" ? "Book" : "User"} ID copied to clipboard!`);
    }).catch((error) => {
      console.error(`Error copying ${type} ID: `, error);
      alert(`Failed to copy ${type} ID.`);
    });
  };

  return (
    <div className="container">
      <h1>Info about Users</h1>
      <p>📚 Number of users: {numberOfUsersCount}</p>

      <input
        type="text"
        placeholder="I'm looking for ..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <button onClick={handleSearch} className="btn-table">Search</button>

      <select onChange={(e) => setSortBy(e.target.value)} value={sortBy}>
        <option value="uid">Sort by ID</option>
        <option value="nickname">Sort by Nickname</option>
        <option value="email">Sort by Email</option>
      </select>

      {loading ? (
        <p>Loading users data...</p>
      ) : (
        <>
          <table className="library_table">
          <thead>
            <tr>
              <th>UID</th>
              <th>Nickname</th>
              <th>Email</th>
              <th>Current Books</th>
              <th>Reserved Books</th>
              <th>Allowed to use library</th>
              <th>Last Session</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>
                  {editUserId === user.id ? (
                    <input
                      type="text"
                      name="nickname"
                      value={updatedUser.nickname !== undefined ? updatedUser.nickname : user.nickname}
                      onChange={handleInputChange}
                    />
                  ) : (
                    user.nickname
                  )}
                </td>
                <td>{user.email}</td>
                <td>
                  <ul>
                    {user.currentBooksTitles.map((book) => (
                      <li key={book.bookId}>
                        <td><span onClick={() => copyID(book.bookId, "book")}>{book.title}</span></td>
                      </li>
                    ))}
                  </ul>
                </td>
                <td>
                  <ul>
                    {user.reservedBooksTitles.map((book) => (
                      <li key={book.bookId}>
                        <td><span onClick={() => copyID(book.bookId, "book")}>{book.title}</span></td>
                      </li>
                    ))}
                  </ul>
                </td>
                <td>
                  {editUserId === user.id ? (
                    <select
                      name="allowedToUseLibrary"
                      value={
                        updatedUser.allowedToUseLibrary !== undefined
                          ? String(updatedUser.allowedToUseLibrary)
                          : String(user.allowedToUseLibrary)
                      }
                      onChange={handleInputChange}
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  ) : user.allowedToUseLibrary ? (
                    "Yes"
                  ) : (
                    "No"
                  )}
                </td>
                <td>{user.lastSession}</td>
                <td>
                  {editUserId === user.id ? (
                    <button onClick={handleSaveClick} className="btn">
                      Save
                    </button>
                  ) : (
                    <button onClick={() => handleEditClick(user)} className="btn">
                      Edit
                    </button>
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
    </div>
  );
};

export default InfoAboutUsers;