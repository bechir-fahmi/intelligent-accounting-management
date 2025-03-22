'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import { useAuth } from '../../context/AuthContext';

import 'primereact/resources/primereact.min.css';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primeicons/primeicons.css';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const toast = useRef<Toast>(null);
  const router = useRouter();
  const { login, loading: authLoading } = useAuth();

  // If auth is still initializing, show a loading state
  if (authLoading) {
    return (
      <div className="flex justify-content-center align-items-center h-screen">
        <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const user = await login(formData.email, formData.password);
      
      // Show success message
      toast.current?.show({
        severity: 'success',
        summary: 'Login Successful',
        detail: `Welcome back, ${user.name}!`,
        life: 1500
      });
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Login Failed',
        detail: error.response?.data?.message || 'Invalid credentials',
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-content-center align-items-center h-screen">
      <Toast ref={toast} />
      <Card title="Login" className="w-full md:w-6 lg:w-4">
        <form onSubmit={handleSubmit} className="p-fluid">
          <div className="field mb-4">
            <label htmlFor="email" className="block mb-2">Email</label>
            <InputText 
              id="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              required 
              className="w-full"
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>
          
          <div className="field mb-4">
            <label htmlFor="password" className="block mb-2">Password</label>
            <Password 
              id="password" 
              name="password" 
              value={formData.password} 
              onChange={handleChange} 
              toggleMask 
              required 
              className="w-full"
              placeholder="Enter your password"
              feedback={false}
              disabled={loading}
            />
          </div>
          
          <Button 
            type="submit" 
            label={loading ? "Logging in..." : "Login"}
            icon={loading ? "pi pi-spin pi-spinner" : "pi pi-sign-in"}
            iconPos="right"
            className="w-full mb-3" 
            loading={loading}
            disabled={loading}
          />
          
          <div className="text-center">
            <span>Don't have an account? </span>
            <Link href="/auth/register" className="font-medium">
              Register
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
} 