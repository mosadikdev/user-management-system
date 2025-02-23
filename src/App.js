import { useState, useRef, useContext } from 'react';
import { TodoContext } from "./context/TodoContext";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import './App.css';

function App() {
  const { todos, dispatch, categories } = useContext(TodoContext);
  const [todoInput, setTodoInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState("General");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const inputRef = useRef(null);

  const addTodo = () => {
    if (todoInput.trim()) {
      const exists = todos.some(todo => todo.text.toLowerCase() === todoInput.toLowerCase());

      if (exists) {
        setError("This Task already exists");
        return;
      }

      dispatch({ type: "ADD", payload: { text: todoInput, category: selectedCategory } });
      inputRef.current.focus();
      setTodoInput("");
      setError("");
    }
  };

  const deleteTodo = (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      dispatch({ type: "DELETE", payload: id });
    }
  };

  const filteredTodos = filter === "All" ? todos : todos.filter(todo => todo.category === filter);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const updatedTodos = Array.from(filteredTodos);
    const [movedItem] = updatedTodos.splice(result.source.index, 1);
    updatedTodos.splice(result.destination.index, 0, movedItem);

    dispatch({ type: "REORDER", payload: updatedTodos });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-gray-600 to-gray-400">
      <div className="bg-white shadow-xl rounded-3xl p-16">
        <h1 className="text-center text-3xl text-gray-900 font-bold mb-6">React Todo App 📝</h1>

        <div className="mb-4 flex gap-2">
          <input
            type="text"
            placeholder="Write your todo here"
            value={todoInput}
            onChange={(e) => setTodoInput(e.target.value)}
            ref={inputRef}
            className="border px-3 py-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <button
            onClick={addTodo}
            className="bg-gray-500 px-4 py-2 text-white rounded-lg hover:bg-gray-600"
          >
            ADD
          </button>
        </div>

        {error && <p className="text-red-500 text-center">{error}</p>}

        <div className="mb-4">
          <label className="block text-gray-700">Filter by categories:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border px-3 py-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="All">All</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="todos">
            {(provided) => (
              <ul className="space-y-2" {...provided.droppableProps} ref={provided.innerRef}>
                {filteredTodos.map((todo, index) => (
                  <Draggable key={todo.id} draggableId={todo.id.toString()} index={index}>
                    {(provided) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="flex items-center p-2 rounded-lg bg-gray-100 border border-gray-200"
                      >
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={() => dispatch({ type: "TOGGLE", payload: todo.id })}
                          className="mr-2 h-5 w-5 text-blue-600"
                        />
                        <span className={`flex-grow ${todo.completed ? "line-through text-gray-500" : "text-gray-800"}`}>
                          {todo.text} <span className="text-sm text-gray-500">({todo.category})</span>
                        </span>
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          className="ml-2 bg-red-500 hover:bg-red-600 px-2 text-white rounded-lg"
                        >
                          X
                        </button>
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}

export default App;
