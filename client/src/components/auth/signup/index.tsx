import React from 'react';
import './index.css';
import { Link } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';

/**
 * Renders a signup form with username, password, and password confirmation inputs,
 * password visibility toggle, error handling, and a link to the login page.
 */
const Signup = () => {
  const {
    username,
    password,
    passwordConfirmation,
    showPassword,
    err,
    handleSubmit,
    handleInputChange,
    togglePasswordVisibility,
  } = useAuth('signup');

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-md">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-[#4361ee] text-white w-12 h-12 rounded-full flex items-center justify-center mr-1 shadow-sm">
            <span className="font-bold text-2xl">NU</span>
          </div>
          <span className="text-2xl font-semibold text-gray-800">Sync</span>
        </div>
        <h2 className="text-xl font-bold text-center text-gray-900 mb-2">
          Create an Account
        </h2>
        <p className="text-center text-gray-600 mb-8">Sign up to get started</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username-input"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Please enter your username.
            </label>
            <input
              type="text"
              value={username}
              onChange={(event) => handleInputChange(event, 'username')}
              placeholder="Enter your username"
              required
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-3"
              id="username-input"
            />
          </div>

          <div>
            <label
              htmlFor="password-input"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Please enter your password.
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => handleInputChange(event, 'password')}
              placeholder="Enter your password"
              required
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-3 mb-3"
              id="password-input"
            />
            <input
              type={showPassword ? 'text' : 'password'}
              value={passwordConfirmation}
              onChange={(e) => handleInputChange(e, 'confirmPassword')}
              placeholder="Confirm your password"
              required
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-3"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="showPasswordToggle"
              checked={showPassword}
              onChange={togglePasswordVisibility}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="showPasswordToggle"
              className="ml-2 block text-sm text-gray-700"
            >
              Show Password
            </label>
          </div>

          <button
            type="submit"
            className="w-full inline-flex justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create Account
          </button>
        </form>

        {err && (
          <div className="mt-4 p-3 rounded-md bg-red-50 border border-red-200">
            <p className="text-sm text-red-800">{err}</p>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
          >
            Already have an account? Login here.
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
