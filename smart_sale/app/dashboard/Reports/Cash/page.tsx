"use client";

import { Box, Button, HStack } from "@chakra-ui/react";
import { useMemo, useState } from "react";

/*------------- COMPONENTS ------------------*/
import { DynamicForm } from "@/component/form/DynamicForm";
import { useEnterNavigation } from "@/component/form/useEnterNavigation";

/*------------- HOOKS ------------------*/
import { useCashReport } from "@/hooks/apiHooks/report/useCashReport";
import { useAllBankAccounts } from "@/hooks/apiHooks/bankAccount/useBankAccount";

/*------------- CONFIG ------------------*/
import { CashReportFields } from "@/config/report/CashReport";

/*------------- CONTEXT ------------------*/

import { useTheme } from "@/context/theme/themeContext";

const initialForm = {
    FROMDATE: "",
    TODATE: "",
    PAYMODE: "",
    BANKID: "",
};

function CashReport() {
    const [formData, setFormData] = useState(initialForm);

    const { theme } = useTheme();
    console.log(theme ,'themecontext');

    /* ---------------- DATA ---------------- */
    const { data: bankAccounts } = useAllBankAccounts();
 

    const bankAccountList = useMemo(() => {
        const banks = bankAccounts?.data;
        return Array.isArray(banks)
            ? banks.map((b: any) => ({
                label: b.BANKNAME,
                value: b.ENTRYNO,
            }))
            : [];
    }, [bankAccounts]);

    const payModeCollection = [
        { label: "CASH", value: "CASH" },
        { label: "BANK", value: "BANK" },
    ];

    const formFields = useMemo(() => {
        return CashReportFields({
            payModeList: payModeCollection,
            bankAccountList,
            isDisableBank: formData.PAYMODE !== "BANK",
        });
    }, [formData.PAYMODE, bankAccountList]);

    const fieldNames = formFields.map((f) => f.name);

    const { register, focusNext } = useEnterNavigation(fieldNames, () =>
        console.log("Saved Successfully")
    );

    /* ---------------- FORM CHANGE ---------------- */
    const handleChange = (name: string, value: any) => {
        setFormData((prev) => {
            const updated = { ...prev, [name]: value };

            if (name === "PAYMODE" && value !== "BANK") {
                updated.BANKID = "";
            }

            return updated;
        });
    };

    /* ---------------- MANUAL QUERY ---------------- */
    const {
        data: ReportData,
        isLoading,
        isError,
        refetch, // 🔥 IMPORTANT
    } = useCashReport({
        FROMDATE: formData.FROMDATE,
        TODATE: formData.TODATE,
        PAYMODE: formData.PAYMODE,
        BANKID: Number(formData.BANKID)} , false);

    /* ---------------- VIEW CLICK ---------------- */
    const handleView = async () => {
        await refetch();
    };

    /* ---------------- CLEAR CLICK ---------------- */
    const handleClear = () => {
        setFormData(initialForm);
    };

    return (
        <Box>
            {/* ================= FORM ================= */}
            <Box display={'flex'} bg={theme.colors.formColor} p={2} rounded={'lg'}>
                <DynamicForm
                    fields={formFields}
                    formData={formData}
                    onChange={handleChange}
                    register={register}
                    focusNext={focusNext}
                    layout="horizontal"
                />

                {/* ================= BUTTONS ================= */}
                <HStack >
                    <Button colorPalette="blue" onClick={handleView} rounded={'xl'} size={'xs'}>
                        View
                    </Button>

                    <Button colorPalette="gray" onClick={handleClear} rounded={'xl'} size={'xs'}>
                        Clear
                    </Button>
                </HStack>
            </Box>
            

            {/* ================= TABLE ================= */}
            <Box mt={4}>
                {/* <CustomTable data={ReportData?.data || []} /> */}
            </Box>
        </Box>
    );
}

export default CashReport;