import React from 'react';
import { Redirect } from 'react-router-dom';

type ProtectedRoutesProps = {
  children: React.ReactElement;
};

export const ProtectedRoutes = ({ children }: ProtectedRoutesProps) => {
  const loginKey = localStorage.getItem('loginKey');
  if (!loginKey) return <Redirect to="/login" />;
  return children;
};
