"use client";

import React from "react";
import { Box, Text } from "@chakra-ui/react";
import { useTransactions } from "@/hooks/transaction/useTransactions";
import EditableTable from "@/component/table/EditableTable";

interface TransactionHistoryTableProps {
    customerCode: string;
    transactionType?: string;
    onRowClick: (transaction: any) => void;
    theme: any;
}

export default function TransactionHistoryTable({
    customerCode,
    transactionType,
    onRowClick,
    theme,
}: TransactionHistoryTableProps) {
    const { data: transactions, isLoading } = useTransactions(customerCode);

    const filteredTransactions = React.useMemo(() => {
        if (!transactions?.data) return [];

        let filtered = transactions.data;
   
        if (transactionType) {
            filtered = filtered.filter((t: any) =>
                t.TRANSACTION_TYPE === transactionType
            );
        }
        console.log(filtered,'filtered')
        return filtered;// Show last 10 transactions
    }, [transactions, transactionType]);

    const historyColumns = [
        { key: "SNO", label: "SNO", width: "80px" },
        { key: "DATE", label: "Date", width: "100px" },
        { key: "TRANSACTION_TYPE", label: "Type", width: "100px" },
        { key: "ITEM_COUNT", label: "Items", width: "80px" },
        { key: "TOTAL_NETWT", label: "Net Wt", width: "100px", align: "right" as const },
        { key: "STATUS", label: "Status", width: "100px", align: "right" as const},
    ];

    return (
        <Box>
            <Text fontSize="sm" fontWeight="bold" mb={2}>
                Recent Transactions
            </Text>

           <EditableTable
                columns={historyColumns}
                data={filteredTransactions}
                loading={isLoading}
                striped
                hoverable
                onRowClick={onRowClick}
                showAddButton={false}
                
            /> 
        </Box>
    );
}