// src/App.js
import React, { useState, useEffect, useReducer } from "react";
import { getUsers, addUser, updateUser, deleteUser } from "./services/api";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const initialState = {
  users: [],
  newUser: { name: "", email: "" },
  editingUser: null,
  loading: false,
  error: "",
  searchTerm: "",
  userToDelete: null,
  currentPage: 1,
  usersPerPage: 5,
  selectedUser: null,
  sortConfig: { key: 'name', direction: 'asc' },
  processing: false
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

const App = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    users,
    newUser,
    editingUser,
    loading,
    error,
    searchTerm,
    userToDelete,
    currentPage,
    usersPerPage,
    selectedUser,
    sortConfig,
    processing
  } = state;

  const isValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const totalFilteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  ).length;

  const filteredUsers = [...users]
    .sort((a, b) => {
      const valueA = a[sortConfig.key]?.toLowerCase() || '';
      const valueB = b[sortConfig.key]?.toLowerCase() || '';
      if (valueA < valueB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    })
    .filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

  useEffect(() => {
    const savedUsers = localStorage.getItem('users');
    if (!savedUsers) {
      fetchUsers();
    } else {
      dispatch({ type: 'SET_STATE', payload: { users: JSON.parse(savedUsers) } });
    }
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('users', JSON.stringify(users));
    }
  }, [users]);

  const fetchUsers = async () => {
    dispatch({ type: 'SET_STATE', payload: { loading: true } });
    try {
      const data = await getUsers();
      dispatch({ type: 'SET_STATE', payload: { users: data, error: "" } });
    } catch (error) {
      dispatch({ type: 'SET_STATE', payload: { error: "Failed to load users. Please try again later." } });
    } finally {
      dispatch({ type: 'SET_STATE', payload: { loading: false } });
    }
  };

  const handleAddUser = async () => {
    dispatch({ type: 'SET_STATE', payload: { processing: true } });
    
    let newError = '';
    if (!newUser.name.trim()) newError = "Name is required";
    else if (!newUser.email.trim()) newError = "Email is required";
    else if (!isValidEmail(newUser.email)) newError = "Invalid email format";

    if (newError) {
      dispatch({ type: 'SET_STATE', payload: { error: newError } });
      toast.error(newError);
      dispatch({ type: 'SET_STATE', payload: { processing: false } });
      return;
    }

    try {
      const addedUser = await addUser(newUser);
      dispatch({ type: 'SET_STATE', payload: { 
        users: [...users, addedUser],
        newUser: { name: "", email: "" },
        error: ""
      } });
      toast.success("User added successfully!");
    } catch (error) {
      dispatch({ type: 'SET_STATE', payload: { error: "Failed to add user. Please try again." } });
    }
    dispatch({ type: 'SET_STATE', payload: { processing: false } });
  };

  const handleUpdateUser = async () => {
    dispatch({ type: 'SET_STATE', payload: { processing: true } });
    
    if (!editingUser.name || !editingUser.email) {
      dispatch({ type: 'SET_STATE', payload: { error: "Please fill all fields" } });
      return;
    }
    if (!isValidEmail(editingUser.email)) {
      dispatch({ type: 'SET_STATE', payload: { error: "Please enter a valid email address" } });
      return;
    }

    try {
      const updatedUser = await updateUser(editingUser.id, editingUser);
      dispatch({ type: 'SET_STATE', payload: { 
        users: users.map((user) => (user.id === editingUser.id ? updatedUser : user)),
        editingUser: null,
        error: ""
      } });
      toast.success("User updated successfully!");
    } catch (error) {
      dispatch({ type: 'SET_STATE', payload: { error: "Failed to update user. Please try again." } });
    }
    dispatch({ type: 'SET_STATE', payload: { processing: false } });
  };

  const handleConfirmDelete = async () => {
    dispatch({ type: 'SET_STATE', payload: { processing: true } });
    try {
      await deleteUser(userToDelete);
      dispatch({ type: 'SET_STATE', payload: { 
        users: users.filter((user) => user.id !== userToDelete),
        userToDelete: null
      } });
      toast.success("User deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete user");
    }
    dispatch({ type: 'SET_STATE', payload: { processing: false } });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-100 min-h-screen">
      <ToastContainer position="bottom-right" autoClose={3000} />
      <h1 className="text-3xl font-bold mb-6 text-center">User Management System</h1>

      {error && <div className="text-red-500 p-2 mb-4 text-center">{error}</div>}

      {/* Add User Form */}
      <div className="mb-4 p-4 bg-white shadow-md rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Add User</h2>
        <input
          type="text"
          placeholder="Name"
          className={`border p-2 w-full mb-2 ${!newUser.name && error.includes('Name') ? 'border-red-500' : ''}`}
          value={newUser.name}
          onChange={(e) => dispatch({ type: 'SET_STATE', payload: { newUser: { ...newUser, name: e.target.value } } })}
        />
        <input
          type="email"
          placeholder="Email"
          className={`border p-2 w-full mb-2 ${error.includes('email') ? 'border-red-500' : ''}`}
          value={newUser.email}
          onChange={(e) => dispatch({ type: 'SET_STATE', payload: { newUser: { ...newUser, email: e.target.value } } })}
        />
        <button 
          className={`bg-blue-500 text-white p-2 w-full ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleAddUser}
          disabled={processing}
        >
          {processing ? 'Adding...' : 'Add User'}
        </button>
      </div>

      {/* Controls Section */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
        <input
          type="text"
          placeholder="Search users..."
          className="border p-2 w-full md:w-64"
          value={searchTerm}
          onChange={(e) => dispatch({ type: 'SET_STATE', payload: { searchTerm: e.target.value } })}
        />
        <div className="flex gap-2 w-full md:w-auto">
          <select 
            className="border p-2 w-full"
            value={sortConfig.key}
            onChange={(e) => dispatch({ type: 'SET_STATE', payload: { sortConfig: { ...sortConfig, key: e.target.value } } })}
          >
            <option value="name">Name</option>
            <option value="email">Email</option>
          </select>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded w-full md:w-auto"
            onClick={() => dispatch({ type: 'SET_STATE', payload: { 
              sortConfig: { ...sortConfig, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' }
            } })}
          >
            {sortConfig.direction === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white shadow-md rounded-lg p-4">
        {loading ? (
          <div className="text-center p-4">Loading...</div>
        ) : (
          <>
            <ul>
              {filteredUsers.map((user) => (
                <li key={user.id} className="flex justify-between items-center border-b p-2">
                  <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-gray-600">{user.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="bg-green-500 text-white p-1 rounded"
                      onClick={() => dispatch({ type: 'SET_STATE', payload: { selectedUser: user } })}
                    >
                      View
                    </button>
                    <button
                      className="bg-yellow-500 text-white p-1 rounded"
                      onClick={() => dispatch({ type: 'SET_STATE', payload: { editingUser: user } })}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-500 text-white p-1 rounded"
                      onClick={() => dispatch({ type: 'SET_STATE', payload: { userToDelete: user.id } })}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {/* Pagination */}
            <div className="mt-4 flex justify-center space-x-2">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
                disabled={currentPage === 1}
                onClick={() => dispatch({ type: 'SET_STATE', payload: { currentPage: currentPage - 1 } })}
              >
                Previous
              </button>
              <span className="px-4 py-2">Page {currentPage}</span>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
                disabled={currentPage * usersPerPage >= totalFilteredUsers}
                onClick={() => dispatch({ type: 'SET_STATE', payload: { currentPage: currentPage + 1 } })}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {editingUser && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Edit User</h2>
            <input
              type="text"
              placeholder="Name"
              className={`border p-2 w-full mb-2 ${!editingUser.name ? 'border-red-500' : ''}`}
              value={editingUser.name}
              onChange={(e) => dispatch({ type: 'SET_STATE', payload: { editingUser: { ...editingUser, name: e.target.value } } })}
            />
            <input
              type="email"
              placeholder="Email"
              className={`border p-2 w-full mb-2 ${!isValidEmail(editingUser.email) ? 'border-red-500' : ''}`}
              value={editingUser.email}
              onChange={(e) => dispatch({ type: 'SET_STATE', payload: { editingUser: { ...editingUser, email: e.target.value } } })}
            />
            <div className="flex gap-2">
              <button
                className="bg-green-500 text-white p-2 flex-1"
                onClick={handleUpdateUser}
                disabled={processing}
              >
                {processing ? 'Saving...' : 'Save'}
              </button>
              <button
                className="bg-gray-400 text-white p-2 flex-1"
                onClick={() => dispatch({ type: 'SET_STATE', payload: { editingUser: null } })}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {userToDelete && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Confirm Delete</h2>
            <p className="mb-4">Are you sure you want to delete this user?</p>
            <div className="flex gap-2">
              <button
                className="bg-red-500 text-white p-2 flex-1"
                onClick={handleConfirmDelete}
                disabled={processing}
              >
                {processing ? 'Deleting...' : 'Delete'}
              </button>
              <button
                className="bg-gray-400 text-white p-2 flex-1"
                onClick={() => dispatch({ type: 'SET_STATE', payload: { userToDelete: null } })}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4">User Details</h2>
            <div className="space-y-2">
              <p><strong>Name:</strong> {selectedUser.name}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Username:</strong> {selectedUser.username}</p>
              <p><strong>Phone:</strong> {selectedUser.phone}</p>
              <p><strong>Website:</strong> {selectedUser.website}</p>
            </div>
            <button
              className="mt-4 bg-gray-400 text-white p-2 w-full"
              onClick={() => dispatch({ type: 'SET_STATE', payload: { selectedUser: null } })}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;