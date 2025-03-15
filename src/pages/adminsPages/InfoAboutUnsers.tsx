import React, { useEffect, useState } from "react";
import { useAuth } from "../components/userInfo";
import { db } from "../../firebase/firebase";
import { collection, query, getDocs, orderBy, updateDoc, doc} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

interface User {
  id: string;
  nickname: string;
  email: string;
  reservedBooks: string[];
  currentBook: string[];
  notes: string;
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
          } as User;
        });

        setUsers(usersData);

        // Fix the count
        setNumberOfUsersCount(usersData.length);
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
        user.currentBook.some((book) => book.toLowerCase().includes(lowerCaseFilter)))
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((user) => (
              <tr key={user.id}>
                {["id", "nickname", "email", "currentBook", "reservedBooks"].map((field) => (
                  <td key={field}>
                    {editUserId === user.id ? (
                      <input
                        type="text"
                        name={field}
                        value={(updatedUser as any)[field as keyof User] || (user as any)[field as keyof User]}
                        onChange={handleInputChange}
                      />
                    ) : field === "currentBook" ? (
                      Array.isArray(user[field as keyof User])
                        ? (user[field as keyof User] as string[]).join(", ") // ✅ Works when it's an array
                        : typeof user[field as keyof User] === "string"
                        ? user[field as keyof User] // ✅ Works when it's already a string
                        : "N/A"
                  ) : field === "reservedBooks" ? (
                      Array.isArray(user[field as keyof User])
                        ? (user[field as keyof User] as string[]).join(", ")
                        : typeof user[field as keyof User] === "string"
                        ? user[field as keyof User]
                        : "N/A"
                  ) : (
                      user[field as keyof User]
                    )}
                  </td>
                ))}
                <td>
                  {editUserId === user.id ? (
                    <button onClick={handleSaveClick} className="btn">Save</button>
                  ) : (
                    <button onClick={() => handleEditClick(user)} className="btn">Edit</button>
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