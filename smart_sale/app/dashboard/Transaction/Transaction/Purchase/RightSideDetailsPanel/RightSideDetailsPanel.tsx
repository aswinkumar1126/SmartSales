"use client";
import React,{useState ,useEffect} from "react";
import { Box, Text, VStack, Badge, Spinner, Combobox, Portal } from "@chakra-ui/react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface RightSideDetailsPanelProps {
    selectedTransactionId: string | null;
    onTransactionClick: (id: string) => void;
    transactionList: any;
    isLoadingTransactions: boolean;
    draftTotals: any;
    headerForm: any;
    selectedTransactionType: any;
    theme: any;
    startDate?: string | null | undefined;
    endDate?: string | null | undefined;
    onStartDateChange: (val?: string) => void;
    onEndDateChange: (val?: string) => void;
    selectedItemCode: number | null;
    onSelectItem: (id: number | null) => void;
    itemsCollection :any,
    itemsFilter:any
    getLabelByValue :any;  

}


export default function RightSideDetailsPanel({
    selectedTransactionId,
    onTransactionClick,
    transactionList,
    isLoadingTransactions,
    draftTotals,
    headerForm,
    selectedTransactionType,
    theme,
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    onSelectItem,
    selectedItemCode,
    itemsCollection,
    itemsFilter,
    getLabelByValue,
}: RightSideDetailsPanelProps) {
    console.log(headerForm,'headerForm')

    const [itemInput, setItemInput] = useState("");
    const [isItemInitialized, setIsItemInitialized] = useState(false);

    useEffect(() => {
        if (!isItemInitialized && itemsCollection?.items?.length) {
            const label = getLabelByValue(itemsCollection, selectedItemCode);
            setItemInput(label);
            setIsItemInitialized(true);
        }
    }, [selectedItemCode, itemsCollection, isItemInitialized]);

    useEffect(() => {
        if (itemsCollection?.items?.length && selectedItemCode) {
            const label = getLabelByValue(itemsCollection, selectedItemCode);
            if (label) setItemInput(label);
        }
    }, [itemsCollection, selectedItemCode]);


    const toStoreFormat = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    };
    const fromStoreFormat = (dateStr?: string|null|undefined) => {
        if (!dateStr) return null;
        const [y, m, d] = dateStr.split("-");
        return new Date(Number(y), Number(m) - 1, Number(d));
    };

    // Auto-filtered list – reacts instantly to customer/type/date changes
    const filteredIds = React.useMemo(() => {
        if (!transactionList?.data) return [];
        return [


            ...(transactionList?.data?.snoList || []),

        ];
    }, [transactionList]);
    
console.log(transactionList?.data?.snoList,"list of transaction")
    const totalTransactions = filteredIds.length;

    

    return (
        <VStack
            align="stretch"
            bg={theme.colors.formColor}
            p={4}
            rounded="xl"
            borderWidth="1px"
            borderColor={theme.colors.borderColor || "gray.200"}
     
            fontSize="xs"
        >
            <Text fontWeight="bold" fontSize="xs">
                Transaction Filter
            </Text>

   

            {/* Date Range */}
            <Box>
               
                <Box display="flex" gap={2}>
                    <Box flex={1}>
                        <Text fontSize='2xs' fontWeight='medium'>START DATE</Text>
                        <DatePicker
                            selected={fromStoreFormat(startDate) || undefined}
                            onChange={(d: Date | null) =>
                                onStartDateChange(d ? toStoreFormat(d) : undefined)
                            }
                            dateFormat="dd-MM-yyyy"
                            placeholderText="Start"
                            maxDate={fromStoreFormat(endDate) || new Date()}
                            className="date-input"
                        />
                    </Box>
                    <Box flex={1}>
                        <Text fontSize='2xs' fontWeight='medium'>END DATE</Text>
                        <DatePicker
                            selected={fromStoreFormat(endDate) || undefined}
                            onChange={(d: Date | null) =>
                                onEndDateChange(d ? toStoreFormat(d) : undefined)
                            }
                            minDate={fromStoreFormat(startDate) ||undefined}
                            maxDate={new Date()}
                            dateFormat="dd-MM-yyyy"
                            placeholderText="End"
                            className="date-input"
                        />
                    </Box>
                    <Box>
                        <Combobox.Root
                            collection={itemsCollection}
                            openOnClick
                            value={selectedItemCode ? [String(selectedItemCode)] : []}
                            inputValue={itemInput}
                            size="xs"

                            onValueChange={(details) => {
                                const selectedValue = details.value[0] ?? "";

                                if (!selectedValue) {
                                    setItemInput("");
                                    onSelectItem(null);
                                    return;
                                }

                                const item = itemsCollection.items.find(
                                    (i: any) => i.value === selectedValue
                                );

                                if (item) {
                                    setItemInput(item.label);
                                    onSelectItem(Number(item.value));
                                }
                            }}

                            onInputValueChange={(e) => {
                                const val = e.inputValue ?? "";
                                setItemInput(val);
                                itemsFilter(val);

                                // 🔑 clear selection when typing
                                if (selectedItemCode) {
                                    onSelectItem(null);
                                }
                            }}
                        >


                            <Combobox.Label fontSize='2xs'>SELECT ITEM</Combobox.Label>
                     
                             <Combobox.Control marginTop={-2.5}>
                                 <Combobox.Input placeholder="Type to search" fontSize='2xs' />
                                 <Combobox.IndicatorGroup >
                                                     
                                     <Combobox.Trigger />
                                   </Combobox.IndicatorGroup>
                                 </Combobox.Control>
                     
                            <Portal >
                                <Combobox.Positioner marginTop={-1.5}>
                                           <Combobox.Content>
                                             <Combobox.Empty fontSize='2xs'>No customer found</Combobox.Empty>
                                                {itemsCollection.items.map((item: any) => (

                                                   <Combobox.Item key={item.value} item={item} fontSize='2xs'>
                                                          {item.label}
                                                  <Combobox.ItemIndicator />
                                      </Combobox.Item>

                                    ))}
                                 </Combobox.Content>
                               </Combobox.Positioner>
                            </Portal>
                         </Combobox.Root>
                    </Box>
                </Box>
            </Box>


            {/* Transaction List */}
            <Box>
                <Text fontSize="xs" fontWeight="medium" mb={1}>
                    Recent Transactions ({totalTransactions})
                </Text>

                <Box maxH="300px" overflowY="auto" pr={1}>
                    {isLoadingTransactions ? (
                        <Box textAlign="center" py={4}>
                            <Spinner size="sm" />
                        </Box>
                    ) : filteredIds.length === 0 ? (
                        <Text fontSize="xs" color="gray.500" textAlign="center" py={4}>
                            No transactions found
                        </Text>
                    ) : (
                        <VStack align="stretch" >
                            {filteredIds.map((id: string) => (
                                <Box
                                    key={id}
                                    px={3}
                                    py={2}
                                    rounded="md"
                                    bg={selectedTransactionId === id ? "blue.100" : "transparent"}
                                    _hover={{ bg: "gray.100" }}
                                    cursor="pointer"
                                    transition="background 0.2s"
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent triggering parent onClick
                                        onTransactionClick(id);
                                    }}
                                   
                                >
                                    <Text fontSize="xs" fontWeight="medium">
                                        {id}
                                    </Text>
                                </Box>
                            ))}
                        </VStack>
                    )}
                </Box>
            </Box>

           
        </VStack>
    );
}