import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Button,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PaymentIcon from "@mui/icons-material/Payment";
import { createLink } from "@meshconnect/web-link-sdk";

type CheckoutPopupProps = {
  open: boolean;
  onClose: () => void;
  cartItems: any[];
  total: string;
};

const CheckoutPopup: React.FC<CheckoutPopupProps> = ({
  open,
  onClose,
  cartItems,
  total,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [linkToken, setLinkToken] = useState("");

  const steps = ["Review Order", "Payment", "Confirmation"];

  // Step 1: Initiate checkout on your server
  const handleCheckout = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/cart/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Checkout failed");
      }

      setOrderId(result.order.id);
      setActiveStep(1); // Move to payment step
    } catch (err: any) {
      setError(err.message || "An error occurred during checkout");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch the Mesh Link token when entering the payment step,
  // sending the total amount from the cart in the request body.
  useEffect(() => {
    if (activeStep === 1 && !linkToken) {
      async function fetchLinkToken() {
        try {
          const res = await fetch("/api/linktoken", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ total }), // Send total amount here
          });
          const data = await res.json();
          setLinkToken(data.content.linkToken);
        } catch (error) {
          console.error("Error fetching link token:", error);
          setError("Failed to fetch payment token.");
        }
      }
      fetchLinkToken();
    }
  }, [activeStep, linkToken, total]);

  // Complete the payment process: mark order as paid and clear the cart
  const completePayment = async () => {
    try {
      // Mark the order as PAID in your database
      const payResponse = await fetch(`/api/orders/${orderId}/pay`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!payResponse.ok) {
        const payError = await payResponse.json();
        throw new Error(payError.message || "Failed to update order status to PAID");
      }
      console.log(`Order ${orderId} marked as PAID.`);

      // Clear the cart
      const clearResponse = await fetch(
        `/api/cart/checkout?orderId=${orderId}`,
        {
          method: "DELETE",
        }
      );

      if (!clearResponse.ok) {
        const clearError = await clearResponse.json();
        console.error("Failed to clear cart:", clearError.message || "Unknown error");
      } else {
        console.log(`Cart cleared for order ${orderId}.`);
      }

      // Move to confirmation step
      setActiveStep(2);
      setOrderComplete(true);
    } catch (err: any) {
      setError(err.message || "Payment or post-payment processing failed");
      console.error("Complete Payment Error:", err);
    }
  };

  // Step 2: Process the payment using Mesh Link integration
  const handlePayment = async () => {
    if (!orderId) {
      setError("Order ID is missing. Cannot proceed.");
      return;
    }
    if (!linkToken) {
      setError("Payment token not available. Please try again later.");
      return;
    }
    try {
      setLoading(true);
      setError("");

      const meshLink = createLink({
        clientId: "e464463b-4008-4ea3-dc09-08dd6caff2f3",
        onIntegrationConnected: (payload) => {
          console.log("Mesh integration connected:", payload);
        },
        onTransferFinished: (transferData) => {
          console.log("Transfer finished:", transferData);
          // Once payment is successful, complete the order processing.
          completePayment();
        },
        onExit: (error) => {
          if (error) {
            console.error("Mesh payment error:", error);
            setError("Payment failed or canceled: " + error);
          } else {
            console.log("Mesh Link UI closed by user.");
          }
        },
        onEvent: (event) => {
          console.log("Mesh Link event:", event);
          // If Mesh returns a transferExecuted event, automatically proceed to confirmation.
          if (event.type === "transferExecuted" && event.payload?.status === "pending") {
            console.log("Transfer executed event received. Completing payment...");
            completePayment();
          }
        },
      });

      await meshLink.openLink(linkToken);
    } catch (err: any) {
      setError(err.message || "Error during mesh payment process");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Final step: close and optionally refresh cart or the entire page
  const handleClose = () => {
    if (orderComplete) {
      window.location.reload();
    } else {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: "offWhite.main",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: "teal.main",
          color: "white",
        }}
      >
        <Typography
          variant="h6"
          component="div"
          sx={{ display: "flex", alignItems: "center" }}
        >
          <PaymentIcon sx={{ mr: 1 }} />
          Checkout
        </Typography>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          disabled={loading}
          sx={{ color: "white" }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, mt: 4 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {activeStep === 0 && (
          <>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Order Summary
            </Typography>
            <List>
              {cartItems.map((item) => (
                <ListItem key={item.id} sx={{ py: 1 }}>
                  <ListItemText
                    primary={item.product.name}
                    secondary={`Quantity: ${item.quantity}`}
                  />
                  <Typography>
                    $
                    {(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                  </Typography>
                </ListItem>
              ))}
            </List>

            <Box sx={{ mt: 3, p: 2, bgcolor: "sand.light", borderRadius: 1 }}>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6" color="primary.dark">
                  ${total}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={onClose}
                  disabled={loading}
                  sx={{ flex: 1, mr: 1 }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCheckout}
                  disabled={loading}
                  sx={{ flex: 1, ml: 1 }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Proceed to Payment"
                  )}
                </Button>
              </Box>
            </Box>
          </>
        )}

        {activeStep === 1 && (
          <>
            <Typography variant="h6" gutterBottom>
              Payment Details
            </Typography>
            <Typography paragraph>
              Order #{orderId} has been created. Please complete your payment.
            </Typography>
            <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handlePayment}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Complete Payment"
                )}
              </Button>
            </Box>
          </>
        )}

        {activeStep === 2 && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="h6" gutterBottom color="success.main">
              Order Completed Successfully!
            </Typography>
            <Typography paragraph>
              Thank you for your purchase. Your order #{orderId} has been confirmed.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleClose}
              sx={{ mt: 2 }}
            >
              Done
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutPopup;
