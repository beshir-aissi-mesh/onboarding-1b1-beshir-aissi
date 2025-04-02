// src/components/HeroSection.tsx
'use client';

import { Box, Typography, Button, Container, Grid } from '@mui/material';
import { styled } from '@mui/material/styles';
import Image from 'next/image';

const HeroContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(10),
  paddingBottom: theme.spacing(10),
}));

const HeroTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  marginBottom: theme.spacing(2),
  color: theme.palette.charcoal.main,
}));

const HeroSubtitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  color: theme.palette.charcoal.light,
  maxWidth: '90%',
}));

const ShopButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.coral.main,
  color: 'white',
  padding: theme.spacing(1.5, 8),
  borderRadius: theme.shape.borderRadius,
  fontWeight: 600,
  '&:hover': {
    backgroundColor: theme.palette.coral.dark,
  },
  fontSize: '1.25rem',
}));

const HeroImage = styled(Box)(({ theme }) => ({
  width: '100%',
  height: 400,
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
}));

const HeroSection = () => {
  return (
    <HeroContainer maxWidth="lg">
      <Grid container spacing={4} alignItems="center">
        {/* Left side - Text content */}
        <Grid size={{ xs: 12, md: 6 }}>
          <HeroTitle variant="h2">
            Shop with Privacy,<br />Shop ICY.
          </HeroTitle>
          <HeroSubtitle variant="h6">
            Purchase shoes, boards, bikes, and more with Crypto, no strings attached.
          </HeroSubtitle>
          <ShopButton variant="contained" size="large">
            Shop Now
          </ShopButton>
        </Grid>
        
        {/* Right side - Image */}
        <Grid size={{ xs: 12, md: 6 }}>
          <HeroImage>
            {/* Updated Image component props */}
            <Image 
              src="/motorcycle.png" 
              alt="Shop ICY Products" 
              fill
              style={{
                objectFit: 'cover',
                objectPosition: 'center',
              }}
              priority
            />
          </HeroImage>
        </Grid>
      </Grid>
    </HeroContainer>
  );
};

export default HeroSection;
