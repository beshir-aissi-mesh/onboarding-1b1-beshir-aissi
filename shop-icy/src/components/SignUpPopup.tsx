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
    Checkbox,
    FormControlLabel,
    Link,
    Box,
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
    const [consentGiven, setConsentGiven] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    
    const validatePassword = (password: string): boolean => {
        return password.length >= 8; // Matches your schema validation
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        
        // Validate inputs
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }
        
        if (!validatePassword(password)) {
            setError('Password must be at least 8 characters long');
            setLoading(false);
            return;
        }
        
        if (!consentGiven) {
            setError('You must agree to the terms and privacy policy');
            setLoading(false);
            return;
        }
        
        try {
            // Step 1: Sign up with Supabase
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                    data: {
                        email: email,
                    }
                }
            });
            
            if (authError) {
                console.error('Supabase auth error:', authError);
                setError(authError.message);
                setLoading(false);
                return;
            }
            
            if (!authData.user) {
                setError('Failed to create account');
                setLoading(false);
                return;
            }
            
            console.log('Supabase signup successful, user ID:', authData.user.id);
            
            // Step 2: Create user in Prisma database with fromSupabase flag
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    id: authData.user.id, // Pass the Supabase user ID
                    fromSupabase: true, // Indicate this is a Supabase sync
                }),
            });
            
            const responseData = await response.json();
            
            if (!response.ok) {
                console.error('Database signup error:', responseData);
                
                // If database signup fails, we should delete the Supabase user
                // to maintain consistency
                try {
                    // Note: Typically only admins can delete users, so this might fail
                    // unless you're using a specific admin client
                    await supabase.auth.admin.deleteUser(authData.user.id);
                } catch (deleteErr) {
                    console.error('Failed to clean up Supabase user after DB error:', deleteErr);
                }
                
                setError(responseData.message || 'Failed to create user record');
                setLoading(false);
                return;
            }
            
            console.log('Prisma signup successful:', responseData);
            
            // Step 3: Handle successful signup
            if (authData.session) {
                // User is immediately signed in (if email confirmation is disabled)
                onSuccess(authData.user);
            } else {
                // Email confirmation is required
                setSuccessMessage(
                    'Your account has been created! Please check your email (including spam folder) ' +
                    'and click the confirmation link to complete registration.'
                );
            }
        } catch (error) {
            console.error('Signup process error:', error);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleClose = () => {
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setConsentGiven(false);
        setError(null);
        setSuccessMessage(null);
        onClose();
    };
    
    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Create an Account</DialogTitle>
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
                        helperText="Password must be at least 8 characters long"
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
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mt: 2 }}>
                        <Checkbox
                            checked={consentGiven}
                            onChange={(e) => setConsentGiven(e.target.checked)}
                            color="primary"
                            required
                            sx={{ pt: 0, mt: 0.25 }}
                        />
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
                            <Typography variant="body2" component="span">
                                I agree to the 
                            </Typography>
                            <Link 
                                href="/terms"
                                sx={{ 
                                    textDecoration: 'none', 
                                    color: 'primary.main',
                                    ml: 0.5,
                                    mr: 0.5,
                                    '&:hover': { textDecoration: 'underline' } 
                                }}
                                onClick={(e) => {
                                    e.preventDefault();
                                    window.open('/terms', '_blank');
                                }}
                            >
                                Terms of Service
                            </Link>
                            <Typography variant="body2" component="span">
                                and
                            </Typography>
                            <Link 
                                href="/privacy"
                                sx={{ 
                                    textDecoration: 'none', 
                                    color: 'primary.main',
                                    ml: 0.5,
                                    '&:hover': { textDecoration: 'underline' } 
                                }}
                                onClick={(e) => {
                                    e.preventDefault();
                                    window.open('/privacy', '_blank');
                                }}
                            >
                                Privacy Policy
                            </Link>
                        </Box>
                    </Box>
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
