// components/ProductDetail.tsx
"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Divider,
  TextField,
  Snackbar,
  Alert,
  Skeleton,
  Chip,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";

type ProductProps = {
  product: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    imageURL: string | undefined;
  } | null;
  isLoading: boolean;
};

const ProductDetail: React.FC<ProductProps> = ({ product, isLoading }) => {
  const theme = useTheme();
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );

  const handleAddToCart = async () => {
    if (!product) return;

    setIsAddingToCart(true);

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity }),
      });

      const data = await response.json();

      if (response.ok) {
        setSnackbarMessage("Added to cart successfully!");
        setSnackbarSeverity("success");
      } else {
        setSnackbarMessage(data.error || "Failed to add to cart");
        setSnackbarSeverity("error");
      }
    } catch (error) {
      setSnackbarMessage("An error occurred. Please try again.");
      setSnackbarSeverity("error");
    } finally {
      setIsAddingToCart(false);
      setOpenSnackbar(true);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleQuantityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value > 0 && value <= (product?.stock || 1)) {
      setQuantity(value);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ py: 4 }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Skeleton variant="text" height={60} width="80%" />
            <Skeleton variant="text" height={30} width="40%" />
            <Skeleton variant="text" height={100} width="100%" />
            <Skeleton variant="text" height={60} width="60%" />
            <Skeleton variant="rectangular" height={100} width="100%" />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (!product) {
    return (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <Typography variant="h4" color="charcoal.main" gutterBottom>
          Product Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          The product you are looking for does not exist or has been removed.
        </Typography>
        <Button variant="contained" color="primary" href="/products">
          Browse Products
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4 }}>
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              height: 400,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: theme.palette.sand.light,
              border: `1px solid ${theme.palette.sand.main}`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box
              component={"img"}
              alt="Product Image"
              src={product.imageURL}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            />
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography
            variant="h4"
            component="h1"
            color="charcoal.main"
            gutterBottom
            fontWeight="bold"
          >
            {product.name}
          </Typography>
          <Typography
            variant="h5"
            color="charcoal.main"
            sx={{ fontWeight: "bold", mb: 2 }}
          >
            ${product.price.toFixed(2)}
          </Typography>

          {product.stock > 0 ? (
            <Chip
              label={
                product.stock > 10 ? "In Stock" : `Only ${product.stock} left`
              }
              color={product.stock > 10 ? "primary" : "warning"}
              sx={{ mb: 2 }}
            />
          ) : (
            <Chip label="Out of Stock" color="error" sx={{ mb: 2 }} />
          )}

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {product.description ||
              "No description available for this product."}
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <TextField
              type="number"
              label="Quantity"
              variant="outlined"
              size="small"
              value={quantity}
              onChange={handleQuantityChange}
              inputProps={{ min: 1, max: product.stock, step: 1 }}
              sx={{
                width: 100,
                mr: 2,
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: theme.palette.sand.main,
                  },
                  "&:hover fieldset": {
                    borderColor: theme.palette.teal.main,
                  },
                },
              }}
            />
            <Button
              variant="contained"
              color="secondary"
              size="large"
              startIcon={
                isAddingToCart ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <ShoppingCartIcon />
                )
              }
              onClick={handleAddToCart}
              disabled={product.stock <= 0 || isAddingToCart}
              sx={{ flexGrow: 1, py: 1.5 }}
            >
              <Typography variant="button" fontWeight="bold">
                {isAddingToCart ? "Adding..." : "Add to Cart"}
              </Typography>
              {/* {isAddingToCart ? "Adding..." : "Add to Cart"} */}
            </Button>
          </Box>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: theme.palette.offWhite.light,
              border: `1px solid ${theme.palette.offWhite.dark}`,
              borderRadius: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              • Fast shipping available with tracking
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Secure payment with crypto
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • 30 day return policy
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductDetail;
