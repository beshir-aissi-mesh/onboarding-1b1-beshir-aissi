"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";

interface SignInPopupProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

const SignInPopup: React.FC<SignInPopupProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Step 1: Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError("Authentication failed");
        setLoading(false);
        return;
      }

      // Step 2: Verify user exists in Prisma database
      const response = await fetch('/api/auth/verify-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: data.user.id,
          email: data.user.email
        }),
      });
      
      const result = await response.json();

      if (!response.ok || result.error) {
        console.error("Error verifying user:", result.error);
        setError("Account not found in database. Please contact support.");
        // Sign out from Supabase since the user doesn't exist in our database
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // Success - user is authenticated and exists in the database
      onSuccess(data.user);
    } catch (unexpectedError) {
      console.error("Sign in error:", unexpectedError);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setPassword("");
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Log In</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Typography color="error" variant="body2" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}
          <TextField
            autoFocus
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            variant="outlined"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Log In"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default SignInPopup;
