import React, { useState, useEffect } from "react";
import { getUsers, addUser, updateUser, deleteUser } from "./services/api";

const App = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: "", email: "" });
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const isValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
      setError("");
    } catch (error) {
      setError("Failed to load users. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email) {
      setError("Please fill all fields");
      return;
    }
    if (!isValidEmail(newUser.email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      const addedUser = await addUser(newUser);
      setUsers([...users, addedUser]);
      setNewUser({ name: "", email: "" });
      setError("");
    } catch (error) {
      setError("Failed to add user. Please try again.");
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser.name || !editingUser.email) {
      setError("Please fill all fields");
      return;
    }
    if (!isValidEmail(editingUser.email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      const updatedUser = await updateUser(editingUser.id, editingUser);
      setUsers(users.map((user) => (user.id === editingUser.id ? updatedUser : user)));
      setEditingUser(null);
      setError("");
    } catch (error) {
      setError("Failed to update user. Please try again.");
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      await deleteUser(id);
      setUsers(users.filter((user) => user.id !== id));
      setError("");
    } catch (error) {
      setError("Failed to delete user. Please try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center">User Management System</h1>

      {error && <div className="text-red-500 p-2 mb-4 text-center">{error}</div>}

      <div className="mb-4 p-4 bg-white shadow-md rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Add User</h2>
        <input
          type="text"
          placeholder="Name"
          className="border p-2 w-full mb-2"
          value={newUser.name}
          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
        />
        <input
          type="email"
          placeholder="Email"
          className="border p-2 w-full mb-2"
          value={newUser.email}
          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
        />
        <button className="bg-blue-500 text-white p-2 w-full" onClick={handleAddUser}>
          Add User
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg p-4">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search users..."
            className="border p-2 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center p-4">Loading...</div>
        ) : (
          <ul>
            {filteredUsers.map((user) => (
              <li key={user.id} className="flex justify-between items-center border-b p-2">
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-gray-600">{user.email}</p>
                </div>
                <div className="space-x-2">
                  <button
                    className="bg-yellow-500 text-white p-1 rounded"
                    onClick={() => setEditingUser(user)}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-500 text-white p-1 rounded"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-2">Edit User</h2>
            <input
              type="text"
              placeholder="Name"
              className="border p-2 w-full mb-2"
              value={editingUser.name}
              onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              className="border p-2 w-full mb-2"
              value={editingUser.email}
              onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
            />
            <div className="flex space-x-2">
              <button className="bg-green-500 text-white p-2 flex-1" onClick={handleUpdateUser}>
                Save
              </button>
              <button className="bg-gray-400 text-white p-2 flex-1" onClick={() => setEditingUser(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;