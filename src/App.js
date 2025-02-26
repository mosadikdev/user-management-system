// src/App.js
import React, { useEffect, useReducer, useMemo, useCallback } from "react";
import { getUsers, addUser, updateUser, deleteUser } from "./services/api";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const styles = {
  inputField: "w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
  error: "border-red-500 bg-red-50 focus:ring-red-500",
  selectField: "p-2 border rounded-md focus:ring-2 focus:ring-blue-500",
  submitBtn: "w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50",
  sortBtn: "p-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200",
  paginationBtn: "px-4 py-2 border rounded-md hover:bg-gray-100 disabled:opacity-50",
  activePage: "bg-blue-600 text-white hover:bg-blue-700",
  modalBtn: "px-6 py-2 rounded-lg text-white transition-colors",
  searchInput: "w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
};

const UserListItem = React.memo(({ user, onView, onEdit, onDelete }) => (
  <li className="flex justify-between items-center border-b p-2 hover:bg-gray-50 transition-colors">
    <div className="min-w-0 flex-1">
      <p className="font-semibold truncate">{user.name}</p>
      <p className="text-gray-600 truncate">{user.email}</p>
    </div>
    <div className="flex gap-2 flex-shrink-0">
      <button 
        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
        onClick={() => onView(user)}
      >
        View
      </button>
      <button
        className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition-colors"
        onClick={() => onEdit(user)}
      >
        Edit
      </button>
      <button
        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
        onClick={() => onDelete(user.id)}
      >
        Delete
      </button>
    </div>
  </li>
));

const initialState = {
  users: [],
  newUser: { name: "", email: "" },
  editingUser: null,
  loading: false,
  error: "",
  searchTerm: "",
  userToDelete: null,
  currentPage: 1,
  usersPerPage: 10,
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

  const isValidEmail = useCallback((email) => 
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), []);

  const updateState = useCallback((payload) => {
    dispatch({ type: 'SET_STATE', payload });
  }, []);

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const valueA = a[sortConfig.key]?.toLowerCase() || '';
      const valueB = b[sortConfig.key]?.toLowerCase() || '';
      const compareResult = valueA.localeCompare(valueB, undefined, { 
        sensitivity: 'base',
        numeric: true
      });
      return sortConfig.direction === 'asc' ? compareResult : -compareResult;
    });
  }, [users, sortConfig]);

  const filteredUsers = useMemo(() => {
    return [...users]
      .filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const valueA = a[sortConfig.key]?.toLowerCase() || '';
        const valueB = b[sortConfig.key]?.toLowerCase() || '';
        return sortConfig.direction === 'asc' 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA);
      })
      .slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);
  }, [users, searchTerm, sortConfig, currentPage, usersPerPage]);
  

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * usersPerPage;
    return filteredUsers.slice(start, start + usersPerPage);
  }, [filteredUsers, currentPage, usersPerPage]);

  useEffect(() => {
    const savedUsers = localStorage.getItem('users');
    if (savedUsers) {
      dispatch({ type: 'SET_STATE', payload: { users: JSON.parse(savedUsers) } });
    } else {
      fetchUsers();
    }
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('users', JSON.stringify(users));
    }
  }, [users]);

  const fetchUsers = useCallback(async () => {
    updateState({ loading: true });
    try {
      const data = await getUsers();
      updateState({ 
        users: data,
        error: "",
        currentPage: 1
      });
    } catch (error) {
      updateState({ error: error.message });
      toast.error(`Failed to load users: ${error.message}`);
    } finally {
      updateState({ loading: false });
    }
  }, [updateState]);

  const handleAddUser = async () => {
    updateState({ processing: true });
    
    try {
      if (!newUser.name.trim()) throw new Error("Name is required");
      if (!newUser.email.trim()) throw new Error("Email is required");
      if (!isValidEmail(newUser.email)) throw new Error("Invalid email format");

      const addedUser = await addUser(newUser);
      updateState({ 
        users: [...users, addedUser],
        newUser: { name: "", email: "" },
        error: ""
      });
      toast.success(
        <div>
          <p className="font-semibold">User Added!</p>
          <p className="text-sm">{addedUser.name} - {addedUser.email}</p>
        </div>
      );
    } catch (error) {
      updateState({ error: error.message });
      toast.error(
        <div>
          <p className="font-semibold">Add User Failed!</p>
          <p className="text-sm">{error.message}</p>
        </div>
      );
    }
    updateState({ processing: false });
  };

  const handleUpdateUser = async () => {
    updateState({ processing: true });
    
    try {
      if (!editingUser?.name || !editingUser?.email) {
        throw new Error("All fields are required");
      }
      if (!isValidEmail(editingUser.email)) {
        throw new Error("Invalid email format");
      }

      const updatedUser = await updateUser(editingUser.id, editingUser);
      updateState({ 
        users: users.map(user => 
          user.id === updatedUser.id ? updatedUser : user
        ),
        editingUser: null
      });
      toast.success(
        <div>
          <p className="font-semibold">Update Successful!</p>
          <p className="text-sm">{updatedUser.name} - {updatedUser.email}</p>
        </div>
      );
    } catch (error) {
      toast.error(
        <div>
          <p className="font-semibold">Update Failed!</p>
          <p className="text-sm">{error.message}</p>
        </div>
      );
    }
    updateState({ processing: false });
  };

  const handleConfirmDelete = async () => {
    updateState({ processing: true });
    try {
      await deleteUser(userToDelete);
      updateState({ 
        users: users.filter(user => user.id !== userToDelete),
        userToDelete: null
      });
      toast.success(
        <div>
          <p className="font-semibold">User Deleted!</p>
          <p className="text-sm">ID: {userToDelete}</p>
        </div>
      );
    } catch (error) {
      toast.error(
        <div>
          <p className="font-semibold">Deletion Failed!</p>
          <p className="text-sm">{error.message}</p>
        </div>
      );
    }
    updateState({ processing: false });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <ToastContainer position="top-right" autoClose={4000} />
      
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          User Management System
        </h1>
        <p className="text-gray-600">
          Total Users: {users.length} | Showing: {paginatedUsers.length}
        </p>
      </header>

      <main className="space-y-8">
        {/* Add User Section */}
        <section className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Add New User</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Full Name"
              className={`${styles.inputField} ${
                !newUser.name && error.includes('Name') ? styles.error : ''
              }`}
              value={newUser.name}
              onChange={e => updateState({ 
                newUser: { ...newUser, name: e.target.value },
                error: ""
              })}
            />
            <input
              type="email"
              placeholder="Email Address"
              className={`${styles.inputField} ${
                error.includes('email') ? styles.error : ''
              }`}
              value={newUser.email}
              onChange={e => updateState({ 
                newUser: { ...newUser, email: e.target.value },
                error: ""
              })}
            />
          </div>
          <button
            className={`${styles.submitBtn} mt-4`}
            onClick={handleAddUser}
            disabled={processing}
          >
            {processing ? 'Adding User...' : 'Add User'}
          </button>
        </section>

        {/* Controls Section */}
        <section className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="w-full md:w-96">
              <input
                type="text"
                placeholder="Search users..."
                className={styles.searchInput}
                value={searchTerm}
                onChange={e => updateState({ searchTerm: e.target.value })}
              />
            </div>
            
            <div className="flex gap-4 items-center w-full md:w-auto">
              <div className="flex items-center gap-2">
                <label className="text-gray-700">Sort by:</label>
                <select
                  className={styles.selectField}
                  value={sortConfig.key}
                  onChange={e => updateState({ 
                    sortConfig: { ...sortConfig, key: e.target.value }
                  })}
                >
                  <option value="name">Name</option>
                  <option value="email">Email</option>
                </select>
                <button
                  className={styles.sortBtn}
                  onClick={() => updateState({
                    sortConfig: { 
                      ...sortConfig, 
                      direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' 
                    }
                  })}
                >
                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-gray-700">Items per page:</label>
                <select
                  className={styles.selectField}
                  value={usersPerPage}
                  onChange={e => updateState({ 
                    usersPerPage: Number(e.target.value),
                    currentPage: 1
                  })}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Users List Section */}
        <section className="bg-white p-6 rounded-xl shadow-sm">
          {loading ? (
            <div className="text-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading users...</p>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-gray-200">
                {paginatedUsers.map(user => (
                  <UserListItem
                    key={user.id}
                    user={user}
                    onView={user => updateState({ selectedUser: user })}
                    onEdit={user => updateState({ editingUser: user })}
                    onDelete={id => updateState({ userToDelete: id })}
                  />
                ))}
              </ul>

              {paginatedUsers.length === 0 && !loading && (
                <div className="text-center p-8 text-gray-500">
                  No users found matching your criteria
                </div>
              )}

              {/* Pagination Controls */}
              <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * usersPerPage + 1} to{' '}
                  {Math.min(currentPage * usersPerPage, filteredUsers.length)} of{' '}
                  {filteredUsers.length} results
                </div>
                
                <div className="flex gap-2">
                  <button
                    className="pagination-btn"
                    onClick={() => updateState({ currentPage: currentPage - 1 })}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      className={`${styles.paginationBtn} ${
                        currentPage === i + 1 ? styles.activePage : ''
                      }`}
                      onClick={() => updateState({ currentPage: i + 1 })}
                    >
                      {i + 1}
                    </button>
                  ))}
                  
                  <button
                    className="pagination-btn"
                    onClick={() => updateState({ currentPage: currentPage + 1 })}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </main>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-2xl font-bold mb-4">Edit User</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Name"
                className="input-field"
                value={editingUser.name}
                onChange={e => updateState({
                  editingUser: { ...editingUser, name: e.target.value }
                })}
              />
              <input
                type="email"
                placeholder="Email"
                className={`input-field ${!isValidEmail(editingUser.email) ? 'error' : ''}`}
                value={editingUser.email}
                onChange={e => updateState({
                  editingUser: { ...editingUser, email: e.target.value }
                })}
              />
              <div className="flex gap-4 mt-6">
                <button
                  className={`${styles.modalBtn} bg-green-500 hover:bg-green-600`}
                  onClick={handleUpdateUser}
                  disabled={processing}
                >
                  {processing ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  className={`${styles.modalBtn} bg-gray-400 hover:bg-gray-500`}
                  onClick={() => updateState({ editingUser: null })}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-2xl font-bold mb-4">Confirm Delete</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className="flex gap-4 justify-end">
              <button
                className="modal-btn bg-red-500 hover:bg-red-600"
                onClick={handleConfirmDelete}
                disabled={processing}
              >
                {processing ? 'Deleting...' : 'Delete Permanently'}
              </button>
              <button
                className="modal-btn bg-gray-400 hover:bg-gray-500"
                onClick={() => updateState({ userToDelete: null })}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-2xl font-bold mb-4">User Details</h2>
            <div className="space-y-3">
              <DetailItem label="Name" value={selectedUser.name} />
              <DetailItem label="Email" value={selectedUser.email} />
              <DetailItem label="Username" value={selectedUser.username} />
              <DetailItem label="Phone" value={selectedUser.phone} />
              <DetailItem label="Website" value={selectedUser.website} />
              <DetailItem label="Company" value={selectedUser.company?.name} />
              <DetailItem 
                label="Address" 
                value={`${selectedUser.address?.street}, ${selectedUser.address?.city}`} 
              />
            </div>
            <button
              className={`${styles.modalBtn} bg-gray-400 hover:bg-gray-500`}
              onClick={() => updateState({ selectedUser: null })}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const DetailItem = ({ label, value }) => (
  <div className="flex justify-between items-center py-2 border-b">
    <span className="font-medium text-gray-600">{label}:</span>
    <span className="text-gray-800 truncate max-w-[60%]">{value || 'N/A'}</span>
  </div>
);



export default App;