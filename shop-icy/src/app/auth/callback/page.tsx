// app/auth/callback/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { CircularProgress, Typography, Box, Container } from '@mui/material';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Confirming your email...');
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const supabase = createClient();
    
    const handleEmailConfirmation = async () => {
      try {
        const { error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Confirmation error:', error.message);
          setError('Unable to confirm your email. The link may have expired.');
          return;
        }
        
        setMessage('Email confirmed! Redirecting you...');
        
        setTimeout(() => router.push('/'), 2000);
      } catch (err) {
        console.error('Unexpected error during confirmation:', err);
        setError('An unexpected error occurred. Please try again or contact support.');
      }
    };
    
    handleEmailConfirmation();
  }, [router]);
  
  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        {error ? (
          <Typography variant="h6" color="error" gutterBottom>
            {error}
          </Typography>
        ) : (
          <>
            <CircularProgress size={60} sx={{ mb: 4 }} />
            <Typography variant="h5" gutterBottom>
              {message}
            </Typography>
          </>
        )}
      </Box>
    </Container>
  );
}
