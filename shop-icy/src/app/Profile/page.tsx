"use client";

import { useEffect, useState } from "react";
import { createLink, LinkPayload } from "@meshconnect/web-link-sdk";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Container,
  Divider,
  Alert,
  AlertTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Skeleton,
  Chip,
  Stack,
  Link as MuiLink,
  useTheme,
  Avatar,
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import LinkIcon from "@mui/icons-material/Link";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";
import Image from "next/image";

// Define an interface for the asset structure returned by Mesh
interface Asset {
  symbol: string;
  amount: number;
  marketValue?: number;
  lastPrice?: number;
}

export default function Profile() {
  const theme = useTheme();
  const [meshLink, setMeshLink] = useState<ReturnType<
    typeof createLink
  > | null>(null);
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingToken, setLoadingToken] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionSuccess, setConnectionSuccess] = useState(false);

  useEffect(() => {
    const fetchLinkToken = async () => {
      setLoadingToken(true);
      try {
        const res = await fetch("/api/linktoken/holdings", { method: "POST" });
        if (!res.ok) {
          throw new Error("Failed to fetch link token");
        }
        const data = await res.json();
        setLinkToken(data.content.linkToken);
      } catch (err) {
        console.error("Failed to fetch link token:", err);
        setError(
          "Unable to initialize wallet connection. Please try again later."
        );
      } finally {
        setLoadingToken(false);
      }
    };
    fetchLinkToken();
  }, []);

  useEffect(() => {
    // Initialize Mesh Connect Link
    const link = createLink({
      clientId: process.env.NEXT_PUBLIC_MESH_CLIENT_ID || "<YOUR_CLIENT_ID>",
      // Called when the user successfully connects their wallet
      onIntegrationConnected: (payload: LinkPayload) => {
        console.log("Integration connected:", payload);
        setConnectionSuccess(true);
        handleConnected(payload);
      },
      // Called when the user exits the Link flow (optionally with an error)
      onExit: (error) => {
        if (error) {
          console.error("Link exited with error:", error);
          setError("Connection was interrupted or failed. Please try again.");
        }
        setLoading(false);
      },
    });
    setMeshLink(link);
  }, []);

  // Open the Mesh Connect Link UI when the user clicks the connect button
  const openMeshLink = () => {
    if (meshLink && linkToken) {
      setLoading(true);
      setError(null);
      meshLink.openLink(linkToken);
    } else {
      setError("Unable to connect. Please try again later.");
    }
  };

  // Handle the response from Mesh after a successful connection.
  // Extract the auth token and account type, then call API route to fetch holdings.
  const handleConnected = async (payload: LinkPayload) => {
    setLoading(true);

    if (!payload.accessToken || !payload.accessToken.accountTokens?.length) {
      setError("No valid access token received.");
      setLoading(false);
      return;
    }

    const authToken = payload.accessToken.accountTokens[0].accessToken;
    const accountType = payload.accessToken.brokerType; // ie "cryptocurrencyWallet"

    try {
      const res = await fetch("/api/mesh/holdings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authToken, accountType }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const result = await res.json();
      // Assumes Mesh returns positions in result.content.cryptocurrencyPositions
      const positions = result.content?.cryptocurrencyPositions;

      if (positions && positions.length > 0) {
        setAssets(positions);
      } else {
        setAssets([]);
      }
    } catch (error: any) {
      console.error("Failed to fetch holdings:", error);
      setError(`Failed to fetch your wallet assets: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total portfolio value
  const totalValue = assets?.reduce((sum, asset) => {
    return sum + (asset.marketValue || 0);
  }, 0);

  // Status display helper
  const getConnectionStatus = () => {
    if (loading) return { color: "info", label: "Connecting..." };
    if (connectionSuccess) return { color: "success", label: "Connected" };
    return { color: "warning", label: "Not Connected" };
  };

  const status = getConnectionStatus();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Link href="/products" passHref style={{ textDecoration: "none" }}>
          <Button
            startIcon={<ArrowBackIcon />}
            sx={{ mb: 2, color: "charcoal.main" }}
          >
            Back to Products
          </Button>
        </Link>

        <Typography
          variant="h3"
          component="h1"
          sx={{ fontWeight: "bold", color: "charcoal.main", mb: 1 }}
        >
          Your Profile
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Manage your profile settings and connect your crypto wallet
        </Typography>

        <Chip
          icon={<AccountBalanceWalletIcon />}
          label={status.label}
          color={status.color as any}
          variant="outlined"
          sx={{ mb: 3 }}
        />

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => setError(null)}
              >
                DISMISS
              </Button>
            }
          >
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        )}
      </Box>

      {/* Connection Card */}
      <Card
        elevation={3}
        sx={{
          mb: 4,
          backgroundColor: "offWhite.main",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <CardHeader
          title="Connect Your Wallet"
          titleTypographyProps={{ variant: "h6" }}
          sx={{
            backgroundColor: "teal.main",
            color: "white",
            pb: 2,
          }}
        />
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 3,
            }}
          >
            <Box
              sx={{
                flex: 0.7,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "background.paper",
                p: 3,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                <Avatar
                  alt="Coinbase Logo"
                  src="https://cdn.iconscout.com/icon/free/png-256/free-coinbase-7213456-5871842.png"
                  sx={{ width: 64, height: 64, mb: 2 }}
                />
              </Box>

              <Typography
                variant="h6"
                align="center"
                sx={{
                  fontWeight: "bold",
                  mb: 2,
                  color: "charcoal.main",
                }}
              >
                Coinbase Wallet
              </Typography>

              {loadingToken ? (
                <Button
                  variant="contained"
                  disabled
                  startIcon={<CircularProgress size={20} />}
                  fullWidth
                >
                  Initializing...
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<LinkIcon />}
                  onClick={openMeshLink}
                  disabled={loading || !linkToken || connectionSuccess}
                  sx={{
                    py: 1.5,
                    px: 3,
                    fontWeight: "bold",
                    width: "100%",
                  }}
                >
                  {loading ? (
                    <>
                      <CircularProgress
                        size={24}
                        color="inherit"
                        sx={{ mr: 1 }}
                      />
                      Connecting...
                    </>
                  ) : connectionSuccess ? (
                    "Connected"
                  ) : (
                    "Connect Wallet"
                  )}
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Assets Display */}
      <Card
        elevation={3}
        sx={{
          backgroundColor: "offWhite.main",
          borderRadius: 2,
          overflow: "visible",
          position: "relative",
        }}
      >
        <CardHeader
          title="Your Wallet Assets"
          titleTypographyProps={{ variant: "h6" }}
          sx={{
            backgroundColor: "charcoal.main",
            color: "white",
          }}
        />

        <CardContent sx={{ p: 3 }}>
          {connectionSuccess && loading && (
            <Box sx={{ p: 3 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Fetching your assets...
              </Typography>
              <Stack spacing={2}>
                {[1, 2, 3].map((item) => (
                  <Skeleton
                    key={item}
                    variant="rectangular"
                    height={60}
                    sx={{ borderRadius: 1 }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {!connectionSuccess && !loading && (
            <Box
              sx={{
                textAlign: "center",
                py: 4,
                px: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ErrorOutlineIcon
                color="action"
                sx={{
                  fontSize: 64,
                  mb: 2,
                  color: "text.secondary",
                  opacity: 0.6,
                }}
              />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No Wallet Connected
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ maxWidth: 400, mb: 2 }}
              >
                Connect your Coinbase wallet to view your cryptocurrency assets
                and portfolio value.
              </Typography>
            </Box>
          )}

          {connectionSuccess && !loading && assets && assets.length === 0 && (
            <Box
              sx={{
                textAlign: "center",
                py: 4,
                px: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ErrorOutlineIcon
                color="info"
                sx={{ fontSize: 64, mb: 2, opacity: 0.6 }}
              />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No Assets Found
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ maxWidth: 400 }}
              >
                Your wallet is connected, but no cryptocurrency assets were
                found. If you believe this is an error, please try reconnecting
                your wallet.
              </Typography>
            </Box>
          )}

          {connectionSuccess && !loading && assets && assets.length > 0 && (
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{ borderRadius: 2 }}
            >
              <Table aria-label="cryptocurrency assets table">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "sand.light" }}>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Currency
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assets.map((asset) => (
                    <TableRow
                      key={asset.symbol}
                      sx={{
                        "&:last-child td, &:last-child th": { border: 0 },
                        transition: "background-color 0.2s",
                        "&:hover": { backgroundColor: "offWhite.light" },
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: "bold", mr: 1 }}
                          >
                            {asset.symbol}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {typeof asset.amount === "number"
                          ? asset.amount.toFixed(6)
                          : asset.amount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
