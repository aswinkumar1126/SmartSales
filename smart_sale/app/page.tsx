"use client";

import { Box, Text } from "@chakra-ui/react";
import useProtected from "@/hooks/auth/useProtected";
import Loader from "@/component/loader/Loader";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useProtected();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login/");
    } else {
      router.replace("/dashboard/Master/Account/Company/");
    }
  }, [loading, user, router]);

  if (loading) return <Loader isLoading={loading} fullscreen />;

  return null;
}
