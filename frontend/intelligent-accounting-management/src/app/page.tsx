'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/auth/login');
  }, [router]);

  return (
    <div className="flex justify-content-center align-items-center h-screen">
      Redirecting to login...
    </div>
  );
}
