import axios from "axios";

const API_URL = "https://jsonplaceholder.typicode.com/users";

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

const handleError = (error) => {
  const errorMessage = error.response
    ? `Server Error: ${error.response.status} - ${error.response.data}`
    : `Network Error: ${error.message}`;
  
  console.error("API Error:", errorMessage);
  throw new Error(errorMessage);
};

apiClient.interceptors.response.use(
  response => response,
  error => {
    handleError(error);
    return Promise.reject(error);
  }
);

export const getUsers = async () => {
  try {
    const response = await apiClient.get("/");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addUser = async (user) => {
  try {
    const response = await apiClient.post("/", user);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateUser = async (id, user) => {
  try {
    const response = await apiClient.put(`/${id}`, user);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    await apiClient.delete(`/${id}`);
  } catch (error) {
    throw error;
  }
};