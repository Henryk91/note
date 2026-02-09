import { useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { RootState } from '../store';
import React from 'react';

type ProtectedRoutesProps = {
  children: React.ReactElement;
};

export const ProtectedRoutes = ({ children }: ProtectedRoutesProps) => {
  const authToken = useSelector((state: RootState) => state.person.authToken);
  if (!authToken) return <Redirect to="/login" />;
  return children;
};
