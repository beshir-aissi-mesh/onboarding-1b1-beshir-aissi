'use client';
import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  CardMedia,
  Chip,
  Skeleton
} from '@mui/material';
import ProductNavbar from '@/components/ProductsNavbar';
import Link from 'next/link';
import { Decimal } from '@prisma/client/runtime/library';

function formatDecimal(decimal: Decimal): number {
  return parseFloat(decimal.toString());
}

const ProductsPage = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true); // Set loading to true when fetching starts
      try {
        // Fetch data from your API endpoint
        const res = await fetch('/api/products');
        if (!res.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await res.json();
        const productsData = data.products;
        const formattedProducts = productsData.map((product: any) => ({
          ...product,
          price: formatDecimal(product.price)
        }));
        setProducts(formattedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false); // Set loading to false when fetching completes
      }
    };

    fetchProducts();
  }, []);

  // Filter products based on the search query (case-insensitive)
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Skeleton product card component
  const SkeletonProductCard = () => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Skeleton variant="rectangular" height={200} animation="wave" />
      <CardContent>
        <Skeleton variant="text" height={32} width="80%" sx={{ mb: 1 }} animation="wave" />
        <Skeleton variant="text" height={28} width="40%" sx={{ mb: 1 }} animation="wave" />
        <Skeleton variant="rounded" height={24} width={80} sx={{ mt: 1, borderRadius: 16 }} animation="wave" />
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <ProductNavbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <Container sx={{ pt: 4, pb: 8 }}>
        <Typography
          variant="h3"
          component="h1"
          sx={{ mb: 4, fontWeight: 'bold', color: 'charcoal.main' }}
        >
          See Our Top Products
        </Typography>

        {loading ? (
          // Show skeleton loading UI
          <Grid container spacing={3}>
            {[...Array(6)].map((_, index) => (
              <Grid size={{ xs: 12, sm: 12, md: 4}} key={`skeleton-${index}`}>
                <SkeletonProductCard />
              </Grid>
            ))}
          </Grid>
        ) : filteredProducts.length === 0 ? (
          // Show no products message only when not loading
          <Typography variant="body1" color="text.secondary">
            No products found. Please check back later.
          </Typography>
        ) : (
          // Show actual products when loaded
          <Grid container spacing={3}>
            {filteredProducts.map((product) => (
              <Grid size={{ xs: 12, sm: 6, md: 4}} key={product.id}>
                <Link href={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: 3
                      }
                    }}
                  >
                    <CardActionArea>
                      <CardMedia
                        component="div"
                        image={product.imageURL}
                        sx={{
                          height: 200,
                          bgcolor: 'sand.light',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                      </CardMedia>
                      <CardContent>
                        <Typography gutterBottom variant="h6" component="h2" color="charcoal.main">
                          {product.name}
                        </Typography>
                        <Typography variant="h6" color="charcoal.main" fontWeight="bold">
                          ${product.price.toFixed(2)}
                        </Typography>
                        {product.stock > 0 ? (
                          <Chip 
                            label={product.stock > 10 ? "In Stock" : `Only ${product.stock} left`} 
                            size="small"
                            color={product.stock > 10 ? "primary" : "warning"}
                            sx={{ mt: 1 }}
                          />
                        ) : (
                          <Chip 
                            label="Out of Stock" 
                            size="small"
                            color="error" 
                            sx={{ mt: 1 }} 
                          />
                        )}
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Link>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default ProductsPage;
