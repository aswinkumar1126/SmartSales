"use client";

import { Box, Text } from "@chakra-ui/react";
import useProtected from "@/hooks/auth/useProtected";
import Loader from "@/component/loader/Loader";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  // const { user, loading } = useProtected();
  // const router = useRouter();

  // useEffect(() => {
  //   if (!loading && !user) {
  //     router.replace("/login");
  //   }
  // }, [loading, user, router]);

  // if (loading) return <Loader isLoading={loading} fullscreen={true}/>;

  // if (!user) return null; // ⛔ prevents flicker

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Text fontSize="sm" fontWeight="medium">
        Main Page
      </Text>
    </Box>
  );
}
