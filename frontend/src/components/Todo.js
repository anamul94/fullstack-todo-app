import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import config from "../config/config";

const Todo = () => {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [error, setError] = useState('');
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  // Create axios instance with interceptors using config
  const api = axios.create({
    baseURL: config.API_BASE_URL
  });

  // Request interceptor
  api.interceptors.request.use(
    (config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        logout();
        navigate('/login');
      }
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      console.log('Fetching todos with token:', token);
      const response = await api.get('/todo');
      console.log('Todos response:', response.data);
      setTodos(response.data);
    } catch (err) {
      console.error('Fetch todos error:', err);
      setError('Failed to fetch todos');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/todo', {
        title: newTodo,
        completed: false
      });
      setTodos([...todos, response.data]);
      setNewTodo('');
    } catch (err) {
      setError('Failed to create todo');
    }
  };

  const handleDelete = async (todoId) => {
    try {
      await api.delete(`/todo/${todoId}`);
      setTodos(todos.filter(todo => todo.id !== todoId));
    } catch (err) {
      setError('Failed to delete todo');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="todo-container">
      <div className="todo-header">
        <h2>My Todos</h2>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="todo-form">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new todo"
          required
        />
        <button type="submit">Add Todo</button>
      </form>

      <div className="todo-list">
        {todos.map((todo) => (
          <div key={todo.id} className="todo-item">
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={async () => {
                try {
                  await api.patch(`/todo/${todo.id}`, {
                    completed: !todo.completed
                  });
                  setTodos(todos.map(t => 
                    t.id === todo.id ? {...t, completed: !t.completed} : t
                  ));
                } catch (err) {
                  setError('Failed to update todo');
                }
              }}
            />
            <span className={todo.completed ? 'completed' : ''}>
              {todo.title}
            </span>
            <button 
              onClick={() => handleDelete(todo.id)}
              className="delete-btn"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Todo; 