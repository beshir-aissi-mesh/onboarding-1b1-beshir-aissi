'use client';

import React from 'react';
import { Container, Typography, Box, Breadcrumbs, Link as MuiLink } from '@mui/material';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 4 }}>
        <Link href="/" passHref legacyBehavior>
          <MuiLink underline="hover" color="inherit">Home</MuiLink>
        </Link>
        <Typography color="text.primary">Privacy Policy</Typography>
      </Breadcrumbs>

      <Typography variant="h3" component="h1" gutterBottom>
        Privacy Policy
      </Typography>
      
      <Typography variant="subtitle1" gutterBottom sx={{ mb: 4 }}>
        Last Updated: April 4, 2025
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          1. Introduction
        </Typography>
        <Typography paragraph>
          At Shop ICY, we respect your privacy and are committed to protecting your personal data. 
          This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
          when you visit our website or make purchases.
        </Typography>
        <Typography paragraph>
          Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, 
          please do not access the site.
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          2. Information We Collect
        </Typography>
        <Typography paragraph>
          <strong>Personal Data:</strong> We may collect personally identifiable information, such as your name, 
          email address, shipping address, and payment information when you register, place an order, or 
          subscribe to our newsletter.
        </Typography>
        <Typography paragraph>
          <strong>Cryptocurrency Information:</strong> When you make payments with cryptocurrency, we collect 
          transaction data necessary to process your payment, including public wallet addresses and transaction hashes.
        </Typography>
        <Typography paragraph>
          <strong>Usage Data:</strong> We automatically collect information about how you interact with our website, 
          such as the pages you visit, your IP address, browser type, and referring website.
        </Typography>
        <Typography paragraph>
          <strong>Cookies and Similar Technologies:</strong> We use cookies and similar tracking technologies to track 
          activity on our Service and store certain information to enhance your browsing experience.
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          3. How We Use Your Information
        </Typography>
        <Typography paragraph>
          We use the information we collect to:
        </Typography>
        <ul>
          <li>
            <Typography paragraph>Process and fulfill your orders</Typography>
          </li>
          <li>
            <Typography paragraph>Manage your account and provide customer support</Typography>
          </li>
          <li>
            <Typography paragraph>Send order confirmations, shipping updates, and receipts</Typography>
          </li>
          <li>
            <Typography paragraph>Communicate with you about products, services, and promotional offers</Typography>
          </li>
          <li>
            <Typography paragraph>Improve our website, products, and customer experience</Typography>
          </li>
          <li>
            <Typography paragraph>Detect and prevent fraud or unauthorized access</Typography>
          </li>
          <li>
            <Typography paragraph>Comply with legal obligations</Typography>
          </li>
        </ul>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          4. Disclosure of Your Information
        </Typography>
        <Typography paragraph>
          We may share your information with:
        </Typography>
        <ul>
          <li>
            <Typography paragraph>
              <strong>Service Providers:</strong> Third-party vendors who perform services on our behalf, 
              such as payment processing, shipping, and website hosting.
            </Typography>
          </li>
          <li>
            <Typography paragraph>
              <strong>Cryptocurrency Payment Processors:</strong> Third-party services that facilitate 
              cryptocurrency transactions.
            </Typography>
          </li>
          <li>
            <Typography paragraph>
              <strong>Compliance with Laws:</strong> If required by law or in response to legal processes, 
              such as court orders or subpoenas.
            </Typography>
          </li>
          <li>
            <Typography paragraph>
              <strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.
            </Typography>
          </li>
        </ul>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          5. Security of Your Information
        </Typography>
        <Typography paragraph>
          We implement appropriate security measures to protect your personal information. However, 
          no electronic transmission or storage system is 100% secure, and we cannot guarantee absolute security.
        </Typography>
        <Typography paragraph>
          For cryptocurrency transactions, we follow industry best practices for secure key management and 
          transaction processing. However, blockchain transactions are immutable and public by nature; 
          therefore, transaction details may be visible on the respective blockchain.
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          6. Data Retention
        </Typography>
        <Typography paragraph>
          We retain your personal information for as long as necessary to fulfill the purposes outlined in this 
          Privacy Policy, unless a longer retention period is required by law or for legitimate business purposes.
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          7. Your Rights
        </Typography>
        <Typography paragraph>
          Depending on your location, you may have certain rights regarding your personal information, including:
        </Typography>
        <ul>
          <li>
            <Typography paragraph>The right to access your personal information</Typography>
          </li>
          <li>
            <Typography paragraph>The right to correct inaccurate or incomplete information</Typography>
          </li>
          <li>
            <Typography paragraph>The right to request deletion of your personal information</Typography>
          </li>
          <li>
            <Typography paragraph>The right to restrict or object to processing</Typography>
          </li>
          <li>
            <Typography paragraph>The right to data portability</Typography>
          </li>
        </ul>
        <Typography paragraph>
          To exercise these rights, please contact us using the information provided in the "Contact Us" section.
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          8. Third-Party Links
        </Typography>
        <Typography paragraph>
          Our website may contain links to third-party websites. We are not responsible for the privacy 
          practices or content of these websites. We encourage you to read the privacy policies of any 
          third-party sites you visit.
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          9. Children's Privacy
        </Typography>
        <Typography paragraph>
          Our Service is not directed to individuals under 18 years of age, and we do not knowingly collect 
          personal information from children under 18. If you become aware that a child has provided us with 
          personal information, please contact us immediately.
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          10. Changes to This Privacy Policy
        </Typography>
        <Typography paragraph>
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting 
          the new Privacy Policy on this page and updating the "Last Updated" date.
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          11. Contact Us
        </Typography>
        <Typography paragraph>
          If you have questions or concerns about this Privacy Policy, please contact us at:
        </Typography>
        <Typography paragraph>
          Email: privacy@shop-icy.com
        </Typography>
        <Typography paragraph>
          Address: 123 Crypto Street, San Francisco, CA 94105, USA
        </Typography>
      </Box>
    </Container>
  );
}
