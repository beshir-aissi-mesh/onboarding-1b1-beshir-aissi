// src/components/HomePage.tsx
'use client';

import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import Navbar from './Navbar';
import HeroSection from './HeroSection';
import Footer from './Footer';

const PageContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.offWhite?.main || '#F8F8F8',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
}));

const MainContent = styled(Box)({
  flexGrow: 1,
});

export default function HomePage() {
  return (
    <PageContainer>
      <Navbar />
      <MainContent>
        <HeroSection />
      </MainContent>
      <Footer />
    </PageContainer>
  );
}