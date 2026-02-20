"use client";

import { Box, Text } from "@chakra-ui/react";
import useProtected from "@/hooks/auth/useProtected";
import Loader from "@/component/loader/Loader";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import EditableTable from "@/component/table/EditableTable";
import EditableCell from "@/component/table/EditableCell";

export default function Home() {
  const { user, loading } = useProtected();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login/");
  }, [loading, user, router]);

  if (loading) return <Loader isLoading fullscreen />;

  const handleCashSave = async (row: any, key: string, value: any) => {
  

    // simulate api delay
    await new Promise((res) => setTimeout(res, 500));
  };

  const dummycolumn = [
    {
      key: "id",
      label: "Date",
      render: (value: any, row: any) => (
        <EditableCell
          value={value}
          type="date"
          onSave={(newVal) => handleCashSave(row, "id", newVal)}
        />
      ),
    },
    {
      key: "name",
      label: "Name",
      render: (value: any, row: any) => (
        <EditableCell
          value={value}
          type="text"
          onSave={(newVal) => handleCashSave(row, "name", newVal)}
        />
      ),
    },
    {
      key: "email",
      label: "Email",
      render: (value: any, row: any) => (
        <EditableCell
          value={value}
          type="text"
          onSave={(newVal) => handleCashSave(row, "email", newVal)}
        />
      ),
    },
  ];

  return (
    <>
      <Box mb={4}>
        <Text fontSize="lg" fontWeight="bold">
          Dummy Editable Table
        </Text>
      </Box>

      <EditableTable
        columns={dummycolumn}
        data={[
          { id: "2024-01-01", name: "John Doe", email: "john@example.com" },
          { id: "2024-01-05", name: "Jane Smith", email: "jane@example.com" },
        ]}
      />
    </>
  );
}
