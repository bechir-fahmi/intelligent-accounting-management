'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { useAuth } from '../context/AuthContext';

import 'primereact/resources/primereact.min.css';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primeicons/primeicons.css';

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not loading and no user, redirect to login
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [loading, user, router]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  if (loading) {
    return <div className="flex justify-content-center align-items-center h-screen">Loading...</div>;
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="p-4">
      <div className="flex justify-content-between align-items-center mb-4">
        <h1 className="text-3xl">Dashboard</h1>
        <Button 
          label="Logout" 
          icon="pi pi-sign-out" 
          className="p-button-danger" 
          onClick={handleLogout} 
        />
      </div>

      <Card className="mb-4">
        <h2>Welcome, {user.name}!</h2>
        {user.type ? (
          <p>You are logged in as: <strong>{user.type}</strong></p>
        ) : (
          <p>Welcome to your dashboard</p>
        )}
      </Card>

      <div className="grid">
        <div className="col-12 md:col-6 lg:col-9">
          <Card title="Overview" className="h-full">
            <p>This is your personalized dashboard. Here you will see relevant information based on your user type.</p>
            
            {user.type === 'admin' && (
              <div className="mt-3">
                <h3>Admin Functions</h3>
                <p>As an admin, you have access to all system features including user management.</p>
              </div>
            )}
            
            {user.type === 'accountant' && (
              <div className="mt-3">
                <h3>Accountant Functions</h3>
                <p>As an accountant, you can manage financial records and generate reports.</p>
              </div>
            )}
            
            {user.type === 'finance' && (
              <div className="mt-3">
                <h3>Finance Functions</h3>
                <p>As a finance user, you can review and process financial transactions.</p>
              </div>
            )}
            
            {user.type === 'finance_director' && (
              <div className="mt-3">
                <h3>Finance Director Functions</h3>
                <p>As a finance director, you have oversight of all financial operations and reporting.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
} 