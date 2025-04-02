// src/components/SignInPopup.tsx
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

interface SignInPopupProps {
    open: boolean;
    onClose: () => void;
    onSuccess: (user: User) => void;
}

const SignInPopup: React.FC<SignInPopupProps> = ({ open, onClose, onSuccess }) => {
    const supabase = createClient();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        
        setLoading(false);
        
        if (error) {
            setError(error.message);
        } else if (data.user) {
            onSuccess(data.user);
        }
    };
    
    const handleClose = () => {
        setEmail('');
        setPassword('');
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
                        {loading ? <CircularProgress size={24} /> : 'Log In'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default SignInPopup;
