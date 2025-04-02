"use client";
import React, { useState, MouseEvent, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  TextField,
  InputAdornment,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import Image from "next/image";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import SignInPopup from "./SignInPopup";
import SignUpPopup from "./SignUpPopup";
// Import Supabase client
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import theme from "@/styles/theme";

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.charcoal.main,
  boxShadow: "none",
}));

const NavButton = styled(Button)(({ theme }) => ({
  marginLeft: theme.spacing(2),
  color: "white",
  "&.signup": {
    backgroundColor: theme.palette.teal.main,
    "&:hover": {
      backgroundColor: theme.palette.teal.dark,
    },
  },
}));

const LogoutMenuItem = styled(MenuItem)(({ theme }) => ({
  color: theme.palette.error.main,
  "&:hover": {
    backgroundColor: theme.palette.error.light + "20",
  },
}));

// Define props for the ProductNavbar
interface ProductNavbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const ProductNavbar: React.FC<ProductNavbarProps> = ({
  searchQuery,
  onSearchChange,
}) => {
  // Initialize Supabase client
  const supabase = createClient();

  // --- State for Popups and User ---
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // --- State for Profile Menu ---
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  // Check for existing session on component mount
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);
    };

    checkSession();

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // --- Handlers for Profile Menu ---
  const handleMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // --- Handlers for Popups ---
  const handleOpenSignIn = () => setIsSignInOpen(true);
  const handleCloseSignIn = () => setIsSignInOpen(false);
  const handleSignInSuccess = (userData: User) => {
    console.log("Login successful in ProductNavbar:", userData);
    setCurrentUser(userData);
    handleCloseSignIn();
  };

  const handleOpenSignUp = () => setIsSignUpOpen(true);
  const handleCloseSignUp = () => setIsSignUpOpen(false);
  const handleSignUpSuccess = (userData: User) => {
    console.log("Sign up successful in ProductNavbar:", userData);
    setCurrentUser(userData);
    handleCloseSignUp();
  };

  // --- Handler for Logout ---
  const handleLogout = async () => {
    handleMenuClose(); // Close the menu first
    console.log("Logging out...");
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error);
    }
  };

  // Other menu handlers remain the same
  const handleProfileClick = () => {
    handleMenuClose();
    console.log("Navigate to Profile page...");
    // Add navigation logic (e.g., router.push('/profile'))
  };

  const handleAddPaymentClick = () => {
    handleMenuClose();
    console.log("Open Add Payment method modal/page...");
    // Add logic to open modal or navigate
  };

  return (
    <>
      <StyledAppBar position="static">
        <Toolbar>
          {/* Left: Logo and Title */}
          <Box sx={{ flex: 1, display: "flex", alignItems: "center" }}>
            <Box mr={1} sx={{ display: "flex" }}>
              <Image
                src="/logo.svg"
                alt="Shop ICY Logo"
                width={40}
                height={40}
                priority
              />
            </Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: "bold" }}>
              Shop ICY
            </Typography>
          </Box>

          {/* Center: Search Bar */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                width: "100%",
                maxWidth: 600,
                [theme.breakpoints.down("md")]: {
                  maxWidth: 400,
                },
              }}
            >
              <TextField
                variant="outlined"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                size="small"
                fullWidth
                sx={{
                  backgroundColor: theme.palette.charcoal.light,
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: theme.palette.sand.main,
                    },
                    "&:hover fieldset": {
                      borderColor: theme.palette.teal.light,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: theme.palette.teal.main,
                    },
                  },
                  "& .MuiInputBase-input": {
                    color: theme.palette.charcoal.main,
                    "&::placeholder": {
                      color: theme.palette.offWhite.main,
                      opacity: 1,
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: theme.palette.offWhite.main }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>

          {/* Right: Auth Buttons / Profile Icon */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            {currentUser ? (
              <>
                <IconButton
                  size="large"
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleMenuOpen}
                  color="inherit"
                  id="profile-button"
                >
                  <MenuIcon />
                </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  open={menuOpen}
                  onClose={handleMenuClose}
                  MenuListProps={{
                    "aria-labelledby": "profile-button",
                  }}
                  PaperProps={{
                    sx: {
                      backgroundColor: "background.paper",
                      color: "text.primary",
                    },
                  }}
                >
                  <MenuItem onClick={handleProfileClick}>Profile</MenuItem>
                  <MenuItem onClick={handleAddPaymentClick}>Add Payment</MenuItem>
                  <Divider sx={{ my: 0.5 }} />
                  <LogoutMenuItem onClick={handleLogout}>Logout</LogoutMenuItem>
                </Menu>
              </>
            ) : (
              <>
                <NavButton variant="text" onClick={handleOpenSignIn}>
                  Log In
                </NavButton>
                <NavButton
                  variant="contained"
                  className="signup"
                  onClick={handleOpenSignUp}
                >
                  Sign Up
                </NavButton>
              </>
            )}
          </Box>
        </Toolbar>
      </StyledAppBar>

      {/* Popups */}
      <SignInPopup
        open={isSignInOpen}
        onClose={handleCloseSignIn}
        onSuccess={handleSignInSuccess}
      />
      <SignUpPopup
        open={isSignUpOpen}
        onClose={handleCloseSignUp}
        onSuccess={handleSignUpSuccess}
      />
    </>
  );
};

export default ProductNavbar;
