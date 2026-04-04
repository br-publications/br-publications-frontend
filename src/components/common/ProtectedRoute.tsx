import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../../services/api.config';

/**
 * A wrapper component to protect routes that require authentication.
 */
const ProtectedRoute: React.FC = () => {
  const isAuth = isAuthenticated();
  const location = useLocation();

  if (!isAuth) {
    // Redirect to login with the current location saved in state
    // so we could potentially come back later (though user requested always go home)
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
          message: 'Please login to access the dashboard.'
        }}
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
