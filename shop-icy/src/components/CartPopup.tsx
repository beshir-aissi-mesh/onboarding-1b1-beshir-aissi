import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Button,
  CircularProgress,
  Stack
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CheckoutPopup from './CheckoutPopup';

type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    description: string | null;
    price: string | number;
    stock: number;
  };
};

type CartPopupProps = {
  open: boolean;
  onClose: () => void;
};

const CartPopup: React.FC<CartPopupProps> = ({ open, onClose }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cart/checkout');
      
      if (!response.ok) {
        throw new Error('Failed to fetch cart data');
      }
      
      const data = await response.json();
      
      if (data.items) {
        setCartItems(data.items);
      } else {
        setCartItems([]);
      }
      setError('');
    } catch (err) {
      setError('Failed to load cart items');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchCartItems();
    }
  }, [open]);

  const handleRemoveItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/cart/checkout?itemId=${itemId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove item');
      }
      
      // Remove item from the local state
      setCartItems(cartItems.filter(item => item.id !== itemId));
    } catch (err) {
      setError('Failed to remove item');
      console.error(err);
    }
  };

  // Now we send the new absolute quantity instead of a delta.
  const handleUpdateQuantity = async (itemId: string, productId: string, newQuantity: number) => {
    const item = cartItems.find(item => item.id === itemId);
    if (!item) return;
    // If no change, do nothing.
    if (newQuantity === item.quantity) return;
    if (newQuantity < 1) return;
    
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          quantity: newQuantity
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update quantity');
      }
      
      // Update local state
      setCartItems(cartItems.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    } catch (err: any) {
      setError(err.message || 'Failed to update quantity');
      console.error(err);
    }
  };

  const calculateTotal = () => {
    return cartItems
      .reduce((sum, item) => {
        const price = parseFloat(item.product.price as string);
        return sum + price * item.quantity;
      }, 0)
      .toFixed(2);
  };

  const handleCheckout = () => {
    setCheckoutOpen(true);
  };

  const handleCloseCheckout = () => {
    setCheckoutOpen(false);
    // Refresh cart after checkout is closed (in case an order was completed)
    fetchCartItems();
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: 'offWhite.main'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          bgcolor: 'teal.main',
          color: 'white'
        }}>
          <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
            <ShoppingCartIcon sx={{ mr: 1 }} />
            Your Shopping Cart
          </Typography>
          <IconButton 
            aria-label="close" 
            onClick={onClose}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
              <CircularProgress color="primary" />
            </Box>
          ) : error ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
              <Typography color="error">{error}</Typography>
            </Box>
          ) : cartItems.length === 0 ? (
            <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="200px">
              <Typography variant="body1" sx={{ mb: 2 }}>Your cart is empty</Typography>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={onClose}
              >
                Continue Shopping
              </Button>
            </Box>
          ) : (
            <>
              <List sx={{ width: '100%' }}>
                {cartItems.map((item) => (
                  <React.Fragment key={item.id}>
                    <ListItem
                      secondaryAction={
                        <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveItem(item.id)}>
                          <DeleteOutlineIcon />
                        </IconButton>
                      }
                      sx={{ py: 2 }}
                    >
                      <ListItemAvatar>
                        <Avatar 
                          variant="rounded"
                          sx={{ bgcolor: 'sand.main', color: 'charcoal.main' }}
                        >
                          {item.product.name[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={item.product.name}
                        secondary={
                          <Typography variant="body2" component="span" color="text.primary">
                            ${parseFloat(item.product.price as string).toFixed(2)}
                          </Typography>
                        }
                      />
                      <Stack direction="row" spacing={1} alignItems="center">
                        <IconButton 
                          size="small" 
                          onClick={() => handleUpdateQuantity(item.id, item.product.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          sx={{ bgcolor: 'sand.light', '&:hover': { bgcolor: 'sand.main' } }}
                        >
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                        <Typography>{item.quantity}</Typography>
                        <IconButton 
                          size="small" 
                          onClick={() => handleUpdateQuantity(item.id, item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          sx={{ bgcolor: 'sand.light', '&:hover': { bgcolor: 'sand.main' } }}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
              </List>
              
              <Box sx={{ mt: 3, p: 2, bgcolor: 'sand.light', borderRadius: 1 }}>
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography variant="h6">Total:</Typography>
                  <Typography variant="h6" color="primary.dark">${calculateTotal()}</Typography>
                </Box>
                
                <Box display="flex" justifyContent="space-between">
                  <Button 
                    variant="outlined" 
                    color="secondary" 
                    onClick={onClose}
                    sx={{ flex: 1, mr: 1 }}
                  >
                    Continue Shopping
                  </Button>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleCheckout}
                    sx={{ flex: 1, ml: 1 }}
                  >
                    Checkout
                  </Button>
                </Box>
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout Popup */}
      {checkoutOpen && (
        <CheckoutPopup
          open={checkoutOpen}
          onClose={handleCloseCheckout}
          cartItems={cartItems}
          total={calculateTotal()}
        />
      )}
    </>
  );
};

export default CartPopup;
