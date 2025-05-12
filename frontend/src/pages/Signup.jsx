import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import OAuth from '../components/OAuth';

const Signup = () => {
  const [formdata, setFormdata] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [signupStatus, setSignupStatus] = useState(null);

  const handleChange = (e) => {
    setFormdata({ ...formdata, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formdata),
      });

      const data = await res.json();

      if (res.ok) {
        setSignupStatus('success');
        setFormdata({ username: '', email: '', password: '' }); // Clear form
      } else {
        if (data.error === 'Email already registered') {
          setSignupStatus('emailExists');
        } else {
          setSignupStatus(data.error || 'failed');
        }
      }
    } catch (error) {
      console.error(error);
      setSignupStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='p-3 max-w-lg mx-auto'>
      <h1 className='text-3xl text-center font-semibold my-7'>Sign Up</h1>
      <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
        <input
          type='text'
          placeholder='Username'
          id='username'
          value={formdata.username}
          className='bg-slate-300 p-3 rounded-lg'
          onChange={handleChange}
          required
        />
        <input
          type='email'
          placeholder='Email'
          id='email'
          value={formdata.email}
          className='bg-slate-300 p-3 rounded-lg'
          onChange={handleChange}
          required
        />
        <input
          type='password'
          placeholder='Password'
          id='password'
          value={formdata.password}
          className='bg-slate-300 p-3 rounded-lg'
          onChange={handleChange}
          required
        />
       <button
          className="bg-slate-800 text-white rounded-md p-2 uppercase hover:opacity-95 disabled:opacity-80"
          disabled={loading}
        >
          {loading ? 'Signing Up...' : 'Sign Up'}
        </button>
        <OAuth />
      </form>

      {signupStatus === 'success' && (
        <p className='text-green-500 mt-4'>User registered successfully!</p>
      )}
      {signupStatus === 'emailExists' && (
        <p className='text-red-500 mt-4'>Email already exists. Please use a different email.</p>
      )}
      {signupStatus === 'failed' && (
        <p className='text-red-500 mt-4'>Signup failed. Please try again later.</p>
      )}
      {signupStatus && !['success', 'emailExists', 'failed'].includes(signupStatus) && (
        <p className='text-red-500 mt-4'>{signupStatus}</p>
      )}

      <div className='flex gap-2 mt-4'>
        <p>Already have an account?</p>
        <Link to='/login'>
          <span className='text-blue-500 hover:underline'>Login</span>
        </Link>
      </div>
    </div>
  );
};

export default Signup;
