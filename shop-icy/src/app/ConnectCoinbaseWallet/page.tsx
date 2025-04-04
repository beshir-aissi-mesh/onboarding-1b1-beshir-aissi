"use client";

// Deprecated: Used this page for testing

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectToProfile() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/Profile");
  }, [router]);

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <p>Redirecting to Profile page...</p>
    </div>
  );
}
