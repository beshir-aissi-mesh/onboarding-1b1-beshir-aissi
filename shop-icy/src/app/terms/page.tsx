'use client';

import React from 'react';
import { Container, Typography, Box, Breadcrumbs, Link as MuiLink } from '@mui/material';
import Link from 'next/link';

export default function TermsOfService() {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 4 }}>
        <Link href="/" passHref legacyBehavior>
          <MuiLink underline="hover" color="inherit">Home</MuiLink>
        </Link>
        <Typography color="text.primary">Terms of Service</Typography>
      </Breadcrumbs>

      <Typography variant="h3" component="h1" gutterBottom>
        Terms of Service
      </Typography>
      
      <Typography variant="subtitle1" gutterBottom sx={{ mb: 4 }}>
        Last Updated: April 4, 2025
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          1. Introduction
        </Typography>
        <Typography paragraph>
          Welcome to Shop ICY. These Terms of Service govern your use of our website and services. 
          By accessing or using our service, you agree to be bound by these Terms.
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          2. Definitions
        </Typography>
        <Typography paragraph>
          <strong>"Service"</strong> refers to the website operated by Shop ICY accessible at https://shop-icy.com.
        </Typography>
        <Typography paragraph>
          <strong>"Products"</strong> refers to the items available for purchase on our Service.
        </Typography>
        <Typography paragraph>
          <strong>"User"</strong> refers to individuals who access or use our Service.
        </Typography>
        <Typography paragraph>
          <strong>"Cryptocurrency"</strong> refers to digital or virtual currency that uses cryptography for security.
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          3. Account Registration
        </Typography>
        <Typography paragraph>
          To access certain features of the Service, you may be required to register for an account. 
          You agree to provide accurate, current, and complete information during the registration process.
        </Typography>
        <Typography paragraph>
          You are responsible for maintaining the confidentiality of your account credentials and for all activities 
          that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          4. Products and Purchases
        </Typography>
        <Typography paragraph>
          All product descriptions, pricing, and availability are subject to change without notice. 
          We reserve the right to modify or discontinue any product without notice.
        </Typography>
        <Typography paragraph>
          Prices for products are quoted in USD but payments are accepted in specified cryptocurrencies 
          at the prevailing exchange rate at the time of transaction.
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          5. Cryptocurrency Payments
        </Typography>
        <Typography paragraph>
          By using cryptocurrency for payment, you acknowledge the inherent risks associated with digital currencies, 
          including but not limited to price volatility, transaction confirmation delays, and potential loss of funds 
          due to mistyped addresses or other user errors.
        </Typography>
        <Typography paragraph>
          We are not responsible for any losses incurred due to fluctuations in cryptocurrency value 
          between the time of order placement and transaction confirmation.
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          6. Shipping and Delivery
        </Typography>
        <Typography paragraph>
          Delivery times are estimates and not guaranteed. We are not responsible for delays 
          caused by shipping carriers or customs clearance for international orders.
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          7. Refund Policy
        </Typography>
        <Typography paragraph>
          Refunds are processed in the same cryptocurrency used for the original purchase, 
          subject to our refund policy detailed elsewhere on the Service.
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          8. Intellectual Property
        </Typography>
        <Typography paragraph>
          All content, features, and functionality of the Service, including but not limited to text, 
          graphics, logos, and software, are owned by Shop ICY and are protected by intellectual property laws.
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          9. User Content
        </Typography>
        <Typography paragraph>
          By submitting reviews, comments, or other content to the Service, you grant us a non-exclusive, 
          royalty-free, perpetual, irrevocable right to use, reproduce, modify, and display such content.
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          10. Limitation of Liability
        </Typography>
        <Typography paragraph>
          To the maximum extent permitted by law, Shop ICY shall not be liable for any indirect, 
          incidental, special, consequential, or punitive damages resulting from your use or 
          inability to use the Service.
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          11. Governing Law
        </Typography>
        <Typography paragraph>
          These Terms shall be governed by and construed in accordance with the laws of the jurisdiction 
          in which Shop ICY operates, without regard to its conflict of law provisions.
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          12. Changes to Terms
        </Typography>
        <Typography paragraph>
          We reserve the right to modify these Terms at any time. We will provide notice of significant changes 
          by posting the new Terms on the Service and updating the "Last Updated" date.
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          13. Contact Information
        </Typography>
        <Typography paragraph>
          For questions about these Terms, please contact us at terms@shop-icy.com.
        </Typography>
      </Box>
    </Container>
  );
}
