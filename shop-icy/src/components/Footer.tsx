// src/components/Footer.tsx
'use client';

import { Box, Container, Typography, Link, Stack } from '@mui/material';
import { styled } from '@mui/material/styles';
import Image from 'next/image';

// Keep custom theme colors if you have them defined elsewhere
// Example fallback if theme isn't fully configured:
const defaultPalette = {
  charcoal: { main: '#36454F', light: '#5F7380' }, // Example charcoal colors
  offWhite: { main: '#F8F8F8', light: '#FFFFFF' }, // Example off-white colors
  teal: { main: '#008080' }, // Example teal color
};

const FooterContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.charcoal?.main || defaultPalette.charcoal.main,
  color: theme.palette.offWhite?.main || defaultPalette.offWhite.main,
  padding: theme.spacing(2, 0), // Reduced padding for a single row feel
  marginTop: 'auto', // Crucial for the flexbox sticky footer approach in parent
}));

const FooterLink = styled(Link)(({ theme }) => ({
  color: theme.palette.offWhite?.light || defaultPalette.offWhite.light,
  textDecoration: 'none',
  '&:hover': {
    color: theme.palette.teal?.main || defaultPalette.teal.main,
    textDecoration: 'underline',
  },
}));

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <FooterContainer>
      <Container maxWidth="lg">
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap" // Allow wrapping on smaller screens
          gap={2} // Add space between items when they wrap
          sx={{
            // Stack items vertically on extra-small screens
            flexDirection: { xs: 'column', sm: 'row' },
            textAlign: { xs: 'center', sm: 'left' },
          }}
        >
          {/* Left Side: Logo and Name */}
          <Box display="flex" alignItems="center" sx={{ mb: { xs: 2, sm: 0 } }}>
            <Box mr={1} position="relative" width={24} height={24}> {/* Slightly smaller logo */}
              <Image
                src="/logo.svg" // Ensure this path is correct relative to `public` directory
                alt="Shop ICY Logo"
                width={24}
                height={24}
                style={{ filter: 'brightness(0) invert(1)' }} // Makes SVG white
              />
            </Box>
            <Typography variant="body1" component="div" sx={{ fontWeight: 'bold' }}>
              Shop ICY
            </Typography>
          </Box>

          {/* Right Side: Copyright and Legal Links */}
          <Box
            display="flex"
            alignItems="center"
            flexWrap="wrap"
            gap={2}
            sx={{
              justifyContent: { xs: 'center', sm: 'flex-end'}, // Center on xs, end on sm+
              width: { xs: '100%', sm: 'auto'} // Take full width on xs when wrapping
            }}
          >
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              © {currentYear} Shop ICY. All rights reserved.
            </Typography>

            <Stack direction="row" spacing={{ xs: 1.5, sm: 2 }} justifyContent="center">
              <FooterLink href="#" variant="body2">Privacy</FooterLink>
              <FooterLink href="#" variant="body2">Terms</FooterLink>
              <FooterLink href="#" variant="body2">Cookies</FooterLink>
            </Stack>
          </Box>
        </Box>
      </Container>
    </FooterContainer>
  );
};

export default Footer;