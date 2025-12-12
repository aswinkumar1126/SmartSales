"use client"
import Image from "next/image";
import Loader from "@/component/loader/Loader";
import { Box } from "@chakra-ui/react";
import useProtected from "@/hooks/auth/useProtected";

export default function Home() {
  // const { user, loading } = useProtected();
  // if (loading) return <div>Loading...</div>; // optional loader
  return (
    <Box className="flex items-center justify-center font-sans">
      <p>Main Page</p>
    </Box>
  );
}
