import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../axiosConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');

    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
      }
    }

    setLoading(false);
  }, []);

  //+++++++++++++++
  const login = async (formData) => {
    const response = await api.post('/auth/login', formData);

    const userData = {
      id: response.data.id,
      name: response.data.name,
      email: response.data.email,
      role: response.data.role || 'user',
      university: response.data.university || '',
      address: response.data.address || '',
    };

    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    return response.data;
  };
  //+++++++++++++++
  // const login = async (formData) => {
  //   const response = await api.post('/auth/login', formData);

  //   if (!response.data?.token) {
  //     throw new Error(response.data?.message || 'Login failed');
  //   }

  //   const userData = {
  //     id: response.data.id,
  //     name: response.data.name,
  //     email: response.data.email,
  //     role: response.data.role || 'user',
  //     university: response.data.university || '',
  //     address: response.data.address || '',
  //   };

  //   localStorage.setItem('token', response.data.token);
  //   localStorage.setItem('user', JSON.stringify(userData));
  //   setUser(userData);

  //   return userData;
  // };
  //+++++++++++++++

  const register = async (formData) => {
    const response = await api.post('/auth/register', formData);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (updatedUser, token) => {
    const newUser = {
      ...updatedUser,
    };

    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));

    if (token) {
      localStorage.setItem('token', token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);