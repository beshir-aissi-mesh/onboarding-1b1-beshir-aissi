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
  Skeleton,
  Link,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
} from "@mui/material";
import { useTheme } from '@mui/material/styles';
import { styled } from "@mui/material/styles";
import Image from "next/image";
import MenuIcon from "@mui/icons-material/Menu";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import SignInPopup from "./SignInPopup";
import SignUpPopup from "./SignUpPopup";
// Import Supabase client
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import CartPopup from "./CartPopup";

// Styled components remain the same
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

const Navbar = () => {
  const theme = useTheme();
  const supabase = createClient();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State for popups, user, and loading indicator
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // State for Cart Popup
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Mobile drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Profile Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);
      setIsLoading(false);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });

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
    console.log("Login successful in Navbar:", userData);
    setCurrentUser(userData);
    handleCloseSignIn();
  };

  const handleOpenSignUp = () => setIsSignUpOpen(true);
  const handleCloseSignUp = () => setIsSignUpOpen(false);
  const handleSignUpSuccess = (userData: User) => {
    console.log("Sign up successful in Navbar:", userData);
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
    window.location.href = "/Profile";
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <>
      <StyledAppBar position="static">
        <Toolbar>
          {/* Logo and Title */}
          <Link href="/products" display="flex" alignItems="center" flexGrow={1} color="inherit" underline="none">
            <Box mr={1} sx={{ display: "flex" }}>
              <Image
                src="/logo.svg"
                alt="Shop ICY Logo"
                width={40}
                height={40}
                priority
              />
            </Box>
            <Typography
              variant="h6"
              component="div"
              sx={{ fontWeight: "bold" }}
            >
              Shop ICY
            </Typography>
          </Link>

          {/* Right Side: Different UI for Mobile vs Desktop */}
          {isMobile ? (
            // Mobile UI: Menu Icon with Drawer
            <>
              {/* Cart Icon (if logged in) */}
              {currentUser && (
                <IconButton
                  color="inherit"
                  aria-label="shopping cart"
                  onClick={() => setIsCartOpen(true)}
                  sx={{ mr: 1 }}
                >
                  <ShoppingCartIcon />
                </IconButton>
              )}
              
              {/* Mobile Menu Button */}
              <IconButton
                edge="end"
                color="inherit"
                aria-label="menu"
                onClick={toggleMobileMenu}
              >
                <MenuIcon />
              </IconButton>
              
              {/* Mobile Drawer */}
              <Drawer
                anchor="right"
                open={mobileMenuOpen}
                onClose={toggleMobileMenu}
                PaperProps={{
                  sx: {
                    width: 250,
                    backgroundColor: theme.palette.background.paper,
                  },
                }}
              >
                <Box
                  sx={{ pt: 2, pb: 2, bgcolor: theme.palette.charcoal.main, color: 'white' }}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Typography variant="h6">Menu</Typography>
                </Box>
                
                <List>
                  {isLoading ? (
                    // Loading state
                    <Box sx={{ p: 2 }}>
                      <Skeleton variant="rectangular" height={40} />
                      <Skeleton variant="rectangular" height={40} sx={{ mt: 1 }} />
                    </Box>
                  ) : currentUser ? (
                    // Logged-in menu items
                    <>
                      <ListItemButton onClick={() => { toggleMobileMenu(); window.location.href = "/Profile"; }}>
                        <ListItemText primary="Profile" />
                      </ListItemButton>
                      <Divider />
                      <ListItemButton onClick={() => { toggleMobileMenu(); handleLogout(); }}>
                        <ListItemText primary="Logout" sx={{ color: theme.palette.error.main }} />
                      </ListItemButton>
                    </>
                  ) : (
                    // Logged-out menu items
                    <>
                      <ListItemButton onClick={() => { toggleMobileMenu(); handleOpenSignIn(); }}>
                        <ListItemText primary="Log In" />
                      </ListItemButton>
                      <ListItemButton 
                        onClick={() => { toggleMobileMenu(); handleOpenSignUp(); }}
                        sx={{ 
                          bgcolor: theme.palette.teal.main,
                          color: 'white',
                          '&:hover': {
                            bgcolor: theme.palette.teal.dark,
                          }
                        }}
                      >
                        <ListItemText primary="Sign Up" />
                      </ListItemButton>
                    </>
                  )}
                </List>
              </Drawer>
            </>
          ) : (
            // Desktop UI: Regular Buttons/Menus
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {/* Only show cart when user is signed in */}
              {currentUser && (
                <IconButton
                  size="large"
                  aria-label="shopping cart"
                  color="inherit"
                  onClick={() => setIsCartOpen(true)}
                  sx={{ mr: 2 }}
                >
                  <ShoppingCartIcon />
                </IconButton>
              )}
              {isLoading ? (
                // Loading placeholder for the auth area
                <Skeleton variant="rectangular" width={120} height={40} />
              ) : currentUser ? (
                // --- Logged In State ---
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
                    <Divider sx={{ my: 0.5 }} />
                    <LogoutMenuItem onClick={handleLogout}>Logout</LogoutMenuItem>
                  </Menu>
                </>
              ) : (
                // --- Logged Out State ---
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
          )}
        </Toolbar>
      </StyledAppBar>

      {/* Existing SignInPopup and SignUpPopup components */}
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
      {/* Cart Popup */}
      <CartPopup open={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default Navbar;
