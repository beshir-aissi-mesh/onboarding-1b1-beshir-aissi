'use client';

import { useState, useEffect } from 'react';
import { createLink } from '@meshconnect/web-link-sdk';

const PaymentPage = () => {
  // Mesh sandbox client id
  const clientId = "e464463b-4008-4ea3-dc09-08dd6caff2f3";
  const [linkToken, setLinkToken] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  // Fetch the link token from our API route on mount
  useEffect(() => {
    async function fetchLinkToken() {
      try {
        const res = await fetch('/api/linktoken', { method: 'POST' });
        const data = await res.json();
        setLinkToken(data.content.linkToken);
      } catch (error) {
        console.error("Error fetching link token:", error);
      }
    }
    fetchLinkToken();
  }, []);

  // Initialize the Mesh Link connection
  const meshLink = createLink({
    clientId: clientId,
    onIntegrationConnected: (payload) => {
      console.log("Coinbase connected:", payload);
    },
    onTransferFinished: (transferData) => {
      console.log("Transfer finished:", transferData);
      setStatus("✅ Payment successful! Transaction ID: " + (transferData as any).transactionId);
    },
    onExit: (error) => {
      if (error) {
        console.error("Exited with error:", error);
        setStatus("Payment failed or canceled: " + error);
      } else {
        console.log("Mesh Link UI closed by user.");
      }
    },
    onEvent: (event) => {
      console.log("Mesh Link Event:", event);
      if ((event as any) === "transferMfaRequired") {
        // In sandbox mode, the MFA code is always 123456.
        console.log("MFA required – please enter code 123456 (sandbox).");
      }
    }
  });

  const handlePayment = async () => {
    if (!linkToken) {
      alert("Link token not set. Please try again later.");
      return;
    }
    try {
      // Open the Mesh Link UI popup which handles Coinbase login and payment confirmation.
      await meshLink.openLink(linkToken);
    } catch (err) {
      console.error("Error opening Mesh Link UI:", err);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Buy Bike with USDC</h2>
      <p>
        Click the button below to pay <strong>10 USDC</strong> using your Coinbase account (Sandbox mode).
      </p>
      <button onClick={handlePayment}>Pay 10 USDC</button>
      <div style={{ marginTop: '1em', fontWeight: 'bold' }}>{status}</div>
    </div>
  );
};

export default PaymentPage;
