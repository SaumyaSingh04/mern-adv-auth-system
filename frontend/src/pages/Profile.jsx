import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getDownloadURL, ref, getStorage, uploadBytesResumable } from 'firebase/storage';
import { app } from '../firebase';
import { v4 as uuidv4 } from 'uuid';

import {
  updateUserStart,
  updateUserSuccess,
  updateUserFailure,
  deleteUserFailure,
  deleteUserStart,
  deleteUserSuccess,
  signOut,
} from '../redux/user/userSlice';

export default function Profile() {
  const fileRef = useRef(null);
  const dispatch = useDispatch();
  const { currentUser, loading, error } = useSelector((state) => state.user);

  const [image, setImage] = useState(null);
  const [imagePercent, setImagePercent] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [formData, setFormData] = useState({});
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    if (image) handleFileUpload(image);
  }, [image]);

  const handleFileUpload = async (image) => {
    const storage = getStorage(app);
    const fileName = uuidv4();
    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, image);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setImagePercent(Math.round(progress));
      },
      (error) => {
        setImageError(true);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setFormData((prev) => ({ ...prev, profile_picture: downloadURL }));
        });
      }
    );
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdateSuccess(false);
    dispatch(updateUserStart());

    // Avoid sending empty password
    const payload = { ...formData };
    if (!formData.password) delete payload.password;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/update/${currentUser._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
         credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || data.success === false) {
        dispatch(updateUserFailure(data.message || 'Update failed'));
        return;
      }

      dispatch(updateUserSuccess(data));
      setUpdateSuccess(true);
    } catch (err) {
      dispatch(updateUserFailure(err.message));
    }
  };

  const handleDeleteAccount = async () => {
    try {
      dispatch(deleteUserStart());
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/delete/${currentUser._id}`, {
        credentials: 'include',
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        dispatch(deleteUserFailure());
        return;
      }
      dispatch(deleteUserSuccess());
    } catch (err) {
      dispatch(deleteUserFailure(err.message));
    }
  };

  const handleSignout = async () => {
    try {
     await fetch(`${import.meta.env.VITE_API_URL}/api/auth/signout`, {
  credentials: 'include',
});
      dispatch(signOut());
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className='p-3 max-w-lg mx-auto'>
      <h1 className='text-3xl font-semibold text-center my-7'>User Profile</h1>

      <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
        <input
          type='file'
          hidden
          ref={fileRef}
          accept='image/*'
          onChange={(e) => setImage(e.target.files[0])}
        />

        <img
          src={formData.profile_picture || currentUser.profile_picture}
          alt='profile'
          className='h-24 w-24 self-center rounded-full object-cover cursor-pointer'
          onClick={() => fileRef.current.click()}
        />

        <p className='text-sm self-center'>
          {imageError ? (
            <span className='text-red-700'>Error uploading image (max 2MB)</span>
          ) : imagePercent > 0 && imagePercent < 100 ? (
            <span className='text-slate-700'>{`Uploading: ${imagePercent}%`}</span>
          ) : imagePercent === 100 ? (
            <span className='text-green-700'>Image uploaded successfully</span>
          ) : (
            ''
          )}
        </p>

        <input
          type='text'
          id='username'
          defaultValue={currentUser.username}
          placeholder='Username'
          className='bg-slate-300 p-3 rounded-lg'
          onChange={handleChange}
        />
        <input
          type='email'
          id='email'
          defaultValue={currentUser.email}
          placeholder='Email'
          className='bg-slate-300 p-3 rounded-lg'
          onChange={handleChange}
        />
        <input
          type='password'
          id='password'
          placeholder='New Password'
          className='bg-slate-300 p-3 rounded-lg'
          onChange={handleChange}
        />

        <button
          type='submit'
          className='bg-slate-700 text-white p-3 rounded-lg uppercase hover:opacity-95 disabled:opacity-80'
          disabled={loading}
        >
          {loading ? 'LOADING...' : 'UPDATE'}
        </button>
      </form>

      <div className='flex justify-between mt-5'>
        <span onClick={handleDeleteAccount} className='text-red-700 cursor-pointer'>
          Delete Account
        </span>
        <span onClick={handleSignout} className='text-red-700 cursor-pointer'>
          Sign Out
        </span>
      </div>

      {error && <p className='text-red-700 mt-5'>Something went wrong!</p>}
      {updateSuccess && <p className='text-green-600 mt-5'>User updated successfully!</p>}
    </div>
  );
}
