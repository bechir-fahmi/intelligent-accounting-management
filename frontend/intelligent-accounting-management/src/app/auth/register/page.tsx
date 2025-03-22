'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown';
import { useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserType, getUserTypeLabel } from '../../utils/userTypeUtils';

import 'primereact/resources/primereact.min.css';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primeicons/primeicons.css';

// User types from the backend
const userTypeOptions = Object.values(UserType).map(type => ({
  label: getUserTypeLabel(type),
  value: type
}));

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    type: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const toast = useRef<Toast>(null);
  const router = useRouter();
  const { register, loading: authLoading } = useAuth();

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

  const handleTypeChange = (e: { value: string }) => {
    setFormData(prev => ({
      ...prev,
      type: e.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Prevent multiple submissions
    
    // Validate that passwords match
    if (formData.password !== formData.confirmPassword) {
      toast.current?.show({
        severity: 'error',
        summary: 'Registration Failed',
        detail: 'Passwords do not match',
        life: 3000
      });
      return;
    }
    
    setLoading(true);
    try {
      const user = await register(formData.name, formData.email, formData.password, formData.type);
      
      toast.current?.show({
        severity: 'success',
        summary: 'Registration Successful',
        detail: 'Your account has been created successfully',
        life: 3000
      });
      
      // Add explicit redirect after success
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Registration Failed',
        detail: error.response?.data?.message || 'Registration failed',
        life: 3000
      });
      setLoading(false); // Only set loading to false on error
    }
  };

  return (
    <div className="flex justify-content-center align-items-center h-screen">
      <Toast ref={toast} />
      <Card title="Register" className="w-full md:w-6 lg:w-5">
        <form onSubmit={handleSubmit} className="p-fluid">
          <div className="field mb-4">
            <label htmlFor="name" className="block mb-2">Full Name</label>
            <InputText 
              id="name" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
              className="w-full" 
              placeholder="Enter your full name"
              disabled={loading}
            />
          </div>

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
              feedback={true}
              disabled={loading}
            />
          </div>

          <div className="field mb-4">
            <label htmlFor="confirmPassword" className="block mb-2">Confirm Password</label>
            <Password 
              id="confirmPassword" 
              name="confirmPassword" 
              value={formData.confirmPassword} 
              onChange={handleChange} 
              toggleMask 
              required 
              className="w-full" 
              placeholder="Confirm your password"
              feedback={false}
              disabled={loading}
            />
          </div>
          
          <div className="field mb-4">
            <label htmlFor="type" className="block mb-2">User Type</label>
            <Dropdown
              id="type"
              value={formData.type}
              options={userTypeOptions}
              onChange={handleTypeChange}
              placeholder="Select user type"
              className="w-full"
              required
              disabled={loading}
            />
          </div>
          
          <Button 
            type="submit" 
            label={loading ? "Registering..." : "Register"}
            icon={loading ? "pi pi-spin pi-spinner" : "pi pi-user-plus"}
            iconPos="right" 
            className="w-full mb-3" 
            loading={loading}
            disabled={loading}
          />
          
          <div className="text-center">
            <span>Already have an account? </span>
            <Link href="/auth/login" className="font-medium">
              Login
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
} 