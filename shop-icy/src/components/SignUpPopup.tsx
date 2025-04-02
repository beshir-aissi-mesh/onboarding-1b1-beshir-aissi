// src/components/SignUpPopup.tsx
'use client';
import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    CircularProgress,
    Typography,
} from '@mui/material';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

interface SignUpPopupProps {
    open: boolean;
    onClose: () => void;
    onSuccess: (user: User) => void;
}

const SignUpPopup: React.FC<SignUpPopupProps> = ({ open, onClose, onSuccess }) => {
    const supabase = createClient();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        
        // Validate passwords match
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }
        
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });
        
        setLoading(false);
        
        if (error) {
            setError(error.message);
        } else if (data.user) {
            if (data.session) {
                // User is immediately signed in (if email confirmation is disabled)
                onSuccess(data.user);
            } else {
                // Email confirmation is required
                setSuccessMessage('Please check your email for a confirmation link.');
            }
        }
    };
    
    const handleClose = () => {
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setError(null);
        setSuccessMessage(null);
        onClose();
    };
    
    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>Sign Up</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    {error && (
                        <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                            {error}
                        </Typography>
                    )}
                    {successMessage && (
                        <Typography color="success.main" variant="body2" sx={{ mb: 2 }}>
                            {successMessage}
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
                    <TextField
                        label="Confirm Password"
                        type="password"
                        fullWidth
                        variant="outlined"
                        margin="normal"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                        {loading ? <CircularProgress size={24} /> : 'Sign Up'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default SignUpPopup;
