import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import CustomLoading from '../components/common/CustomLoading';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <CustomLoading
      fullscreen
      message="Lorebook Studio"
      subtitle="Verificando sesión segura..."
    />
  );
}
