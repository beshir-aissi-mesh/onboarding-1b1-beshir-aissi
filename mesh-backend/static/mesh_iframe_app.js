// static/mesh_iframe_app.js
import { createLink } from "@meshconnect/web-link-sdk";

const LINK_TOKEN = window.LINK_TOKEN;
const CLIENT_ID  = window.MESH_CLIENT_ID;

let rainbowToken = null;
const $  = (id) => document.getElementById(id);
const log = (m)  => { console.log(m); const box = $("#log"); if (box) box.textContent += m + "\n"; };

document.addEventListener("DOMContentLoaded", () => {
  const connectBtn = $("connect");
  const sendBtn    = $("send");

  /* ───────── 1. WALLET LINK FLOW ───────── */
  const linkAuth = createLink({
    clientId: CLIENT_ID,

    onIntegrationConnected(p) {
      rainbowToken = p.accessToken;
      log("✓ wallet linked");
      linkAuth.closeLink();          // hide overlay ONCE
      connectBtn.disabled = true;
      sendBtn.disabled    = false;
    },

    onExit: (err) => log("auth exit: " + (err ?? "closed")),
  });

  connectBtn.onclick = () => {
    if (!LINK_TOKEN) return alert("missing LINK_TOKEN");
    linkAuth.openLink(LINK_TOKEN);   // Mesh shows its overlay
    log("🔗 auth overlay opened");
  };

  /* ───────── 2. TRANSFER FLOW ───────── */
  sendBtn.onclick = async () => {
    if (!rainbowToken) return alert("link wallet first");

    // Get amount - either from input field or use fixed amount if specified
    let amt;
    const fixedAmount = window.FIXED_AMOUNT;
    if (fixedAmount !== undefined) {
      amt = fixedAmount;
    } else {
      const amtEl = $("amt");
      if (!amtEl) return alert("amount input missing");
      amt = amtEl.value;
      if (!amt || isNaN(parseFloat(amt)) || parseFloat(amt) <= 0) return alert("enter a valid amount");
    }

    const res = await fetch("/api/linktoken_transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: amt,
      }),
    });
    const { link_token } = await res.json();

    const linkXfer = createLink({
      clientId: CLIENT_ID,
      accessTokens: [ rainbowToken ],

      onTransferFinished: (p) => {
        log("↪ transfer status: " + p.status);
        linkXfer.closeLink();        // close overlay ONCE
      },

      onExit: (e) => log("transfer exit: " + (e ?? "closed")),
    });

    linkXfer.openLink(link_token);   // second overlay
    log("🔗 transfer overlay opened");
  };
});
