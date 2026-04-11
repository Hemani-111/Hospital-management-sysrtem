import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

import DoctorProfile from './DoctorProfile';
import PatientProfile from './PatientProfile';
import NurseProfile from './NurseProfile';
import AdminProfile from './AdminProfile';

const UserProfileRouter = () => {
  const { user } = useAuthStore();

  switch (user?.role) {
    case 'doctor':
      return <DoctorProfile />;
    case 'patient':
      return <PatientProfile />;
    case 'nurse':
      return <NurseProfile />;
    case 'admin':
      return <AdminProfile />;
    default:
      return <Navigate to="/dashboard" />;
  }
};

export default UserProfileRouter;
