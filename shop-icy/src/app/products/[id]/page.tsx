// app/products/[id]/page.tsx
import React from 'react';
import { Container, Box } from '@mui/material';
import { PrismaClient } from '@prisma/client';
import Navbar from '@/components/Navbar';
import ProductDetail from '@/components/ProductDetail';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// This function formats Decimal from Prisma to a standard number
function formatDecimal(decimal: Decimal): number {
  return parseFloat(decimal.toString());
}

// Update the type definition to indicate params is a Promise
async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  let product = null;

  try {
    // Await params before accessing its properties
    const { id } = await params;
    
    // Now use the extracted id variable
    const productData = await prisma.product.findUnique({
      where: { id }
    });

    if (productData) {
      // Format the Decimal value to a standard number
      product = {
        ...productData,
        price: formatDecimal(productData.price)
      };
    }
  } catch (error) {
    console.error('Error fetching product:', error);
  } finally {
    await prisma.$disconnect();
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      <Container sx={{ pt: 4, pb: 8 }}>
        <ProductDetail product={product} isLoading={false} />
      </Container>
    </Box>
  );
}

export default ProductPage;
