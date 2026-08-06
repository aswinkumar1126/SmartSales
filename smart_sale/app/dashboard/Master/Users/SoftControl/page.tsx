"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Button,
  VStack,
  Text,
  Grid,
  GridItem,
  HStack,
  Fieldset,
  Flex,
} from "@chakra-ui/react";
import { AiOutlineSave } from "react-icons/ai";
import { IoIosExit } from "react-icons/io";
import { FaEdit } from "react-icons/fa";
import { Toaster } from "@/components/ui/toaster";
import { useTheme } from "@/context/theme/themeContext";
import {
  useSoftControls,
  useCreateSoftControl,
  useUpdateSoftControl,
  useSoftControlById,
} from '@/hooks/apiHooks/softControl/useSoftControl';
import { useEnterNavigation } from "@/component/form/useEnterNavigation";
import { DynamicForm } from "@/component/form/DynamicForm";
import { toastError, toastLoaded } from "@/component/toast/toast";
import ScrollToTop from "@/component/scroll/ScrollToTop";
import { DataTable, createDataTableColumns } from "@/component/table/DataTable";
import { usePrint } from "@/context/print/usePrintContext";
import { useRouter } from "next/navigation";
import { FaPrint, FaFileExcel } from "react-icons/fa";
import { FiRefreshCw } from "react-icons/fi";
import { getSoftControlFormFields } from "@/config/user/SoftControlMaster";
import SearchBar from "@/component/search/SearchBar";

import ShortcutDialog from "@/components/shortcut/ShortcutDialog";
import { useTransactionLoader } from "@/utils/loader/ResolveLoader";
import TransactionLoader from "@/component/loader/Transactionloader";
import { useGlobalKey } from "@/components/key/useGlobalKey";
import { Tooltip } from "@/components/ui/tooltip";
// TypeScript interface for SoftControl (matching hooks)
import { SoftControl } from "@/types/softcontrol/SoftControl";


import type { PrintColumn } from "@/component/screens/PrintPreviewScreen";

const softControlHelper = createDataTableColumns<SoftControl>();

function SoftControlMaster() {
  const { theme } = useTheme();
  const router = useRouter();
  const { setData, setColumns, setShowSno, title } = usePrint();
  const { isOpen, status, title: loaderTitle, description, openLoader, resolveLoader, closeLoader } = useTransactionLoader();

  /* -------------------- API HOOKS -------------------- */
  const { data, isLoading: softControlLoading, refetch: softControlRefetch } = useSoftControls();
  const softControls = data ?? [];

  const { data: softControlDataById, isLoading, error } = useSoftControlById('LOT_TAG_CONTROL')
  console.log(softControlDataById, 'softControlDataById')

  const { data: showEditIcon } = useSoftControlById('EDIT_ICON');
  const showEditIcons = showEditIcon?.CTLTEXT === "Y";

  const { mutate: createSoftControl, isPending: isCreating } = useCreateSoftControl();
  const { mutate: updateSoftControl } = useUpdateSoftControl();

  /* -------------------- FORM STATE -------------------- */
  const [form, setForm] = useState<SoftControl>({
    CTLID: "",
    CTLNAME: "",
    CTLTEXT: "",
  });

  const [highlightedId, setHighlightedId] = useState<string | undefined>();
  const [editId, setEditId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* -------------------- FORM HANDLERS -------------------- */
  const handleChange = (field: keyof SoftControl, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setEditId(null);
    setForm({
      CTLID: "",
      CTLNAME: "",
      CTLTEXT: "",
    });
    focusFirst();
    setErrors({});
  };

  const validateField = (field: keyof SoftControl, value: any): string | undefined => {
    switch (field) {
      case "CTLID":
        if (!value) return "ID is required";
        break;
      case "CTLNAME":
        if (!value?.trim()) return "Control Name is required";
        break;
    }
    return undefined;
  };

  const validateForm = (editId?: string): boolean => {
    const newErrors: Record<string, string> = {};

    softControlFormFields.forEach((field) => {
      const value = form[field.name as keyof SoftControl];

      // Required validation
      if (field.required) {
        const error = validateField(
          field.name as keyof SoftControl,
          value
        );
        if (error) newErrors[field.name] = error;
      }

      // ✅ Duplicate ID check (assuming field name is "id")
      if (field.name === "CTLID" && value) {
        const duplicate = softControls?.find((item) => {
          return (
            String(item.CTLID) === String(value) && // same id
            String(item.CTLID) !== String(editId)   // exclude current edit row
          );
        });

        if (duplicate) {
          newErrors[field.name] = "ID already exists";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {


    if (!validateForm(String(editId))) {
      // toastError("Please fix the errors in the form");
      return;
    }

    if (editId) {
      openLoader('update', true)
      updateSoftControl(
        { ...form, id: editId },
        {
          onSuccess: () => {
            resetForm();
            softControlRefetch();
            setHighlightedId(editId);
            resolveLoader("success", "update", "", true)
          },
          onError: () => {
            resolveLoader("error", "update", "", true)
          }
        }
      );
    } else {
      openLoader('save', true)
      createSoftControl(

        { ...form },
        {
          onSuccess: () => {
            resetForm();
            resolveLoader("success", "save", "", true)
            softControlRefetch();
          },
          onError: () => {
            resolveLoader("error", "save", "", true)
          }
        }
      );
    }
  };

  const handleEdit = (sc: SoftControl) => {
    console.log("Editing SoftControl:", sc)
    setEditId(sc.CTLID);
    setForm({
      CTLID: sc.CTLID ?? "",
      CTLNAME: sc.CTLNAME ?? "",
      CTLTEXT: sc.CTLTEXT ?? "",
    });
    focusFirst();
    toastLoaded("SoftControl loaded for editing");
    ScrollToTop();
  };



  /* -------------------- TABLE COLUMNS -------------------- */
  const softControlColumns = useMemo(() => {
    const cols = [
      softControlHelper.display({
        id: "sno",
        header: "Sno",
        cell: ({ row }) => row.index + 1,
      }),
      softControlHelper.accessor("CTLID", { header: "ID" }),
      softControlHelper.accessor("CTLNAME", { header: "NAME" }),
      softControlHelper.accessor("CTLTEXT", { header: "VALUE" }),
    ];

    if (showEditIcons) {
      cols.push(
        softControlHelper.display({
          id: "actions",
          header: "Actions",
          meta: { align: "center" },
          cell: ({ row }) => (
            <Box display="flex" justifyContent="center">
              <FaEdit onClick={() => handleEdit(row.original)} cursor="pointer" />
            </Box>
          ),
        })
      );
    }

    return cols;
  }, [showEditIcons]);

  /* -------------------- EXPORT -------------------- */
  const handleExport = (option: string) => {
    setData(softControls);
    const columns: PrintColumn[] = [
      { key: "CTLID", label: "ID" },
      { key: "CTLNAME", label: "NAME" },
      { key: "CTLTEXT", label: "VALUE" },
    ]
    setColumns(columns);
    setShowSno(true);
    title?.("SoftControl Master");
    router.push(`/print?export=${option}`);
  };

  /* -------------------- FORM CONFIG -------------------- */
  const softControlFormFields = getSoftControlFormFields(editId);
  const fieldSequence = softControlFormFields.map((f) => f.name);
  const { register, focusNext, focusFirst } = useEnterNavigation(
    fieldSequence,
    () => {
      handleSave();
    }
  );
  useGlobalKey("Alt+s", () => handleSave(), "saveTransaction");
  useGlobalKey("Alt+r", () => resetForm(), "Reset");
  useGlobalKey("Alt+e", () => router.back(), "exit");
  useGlobalKey("Alt+u", () => handleSave(), "update");
  /* -------------------- UI -------------------- */
  return (
    <Box fontWeight="semibold" bg={theme.colors.bg} color={theme.colors.primary}>

      <TransactionLoader
        isOpen={isOpen}
        status={status}
        title={loaderTitle}
        description={description}
        onClose={closeLoader}
      />
      <Toaster />
      <ShortcutDialog />
      <Grid templateColumns={{ base: "1fr", lg: "1fr 2fr" }} gap={2}>
        {/* FORM SECTION */}
        <GridItem>
          <VStack bg={theme.colors.formColor} p={4} borderRadius="xl" border="1px solid #eef">

            <Fieldset.Root size="sm" width="100%">
              <Fieldset.Content>
                <DynamicForm
                  fields={softControlFormFields}
                  formData={form}
                  onChange={handleChange}
                  register={register}
                  focusNext={focusNext}
                  disabled={{ CTLID: !!editId }}
                  errors={errors}
                  layout="vertical"
                />
              </Fieldset.Content>
            </Fieldset.Root>

            <HStack>
              <Button size="xs" colorPalette="blue" loading={isCreating} onClick={handleSave}>
                <AiOutlineSave /> {editId ? "Update" : "Save"}
              </Button>
              <Button size="xs" colorPalette="blue" onClick={resetForm}>
                <IoIosExit /> Reset
              </Button>
              <Button size="xs" colorPalette="blue" onClick={() => router.back()}>
                <IoIosExit /> Exit
              </Button>
            </HStack>
          </VStack>
        </GridItem>

        {/* TABLE SECTION */}
        <GridItem minW={0}>
          <Box bg={theme.colors.formColor} p={2} borderRadius="xl" border="1px solid #eef">
            <Box display="flex" mb={2} gap={2} justifyContent="space-between" alignItems="center">
              <Text fontWeight="semibold" fontSize="small">SOFTCONTROL DETAILS</Text>
              <Flex>
                {/* <SearchBar size="xs" placeholder="search by id" /> */}
                <Tooltip content="Refresh">
                  <Button
                    variant="ghost"
                    size="xs"
                    color={theme.colors.primaryText}
                    _hover={{ color: "black" }}
                    onClick={() => softControlRefetch()}
                    aria-label="Refresh"
                    loading={softControlLoading}
                  >
                    <FiRefreshCw />
                  </Button>
                </Tooltip>
                <Button variant="ghost" size="xs" color={theme.colors.green} onClick={() => handleExport("excel")}>
                  <FaFileExcel />
                </Button>
                <Button variant="ghost" size="xs" color={theme.colors.primaryText} onClick={() => handleExport("pdf")}>
                  <FaPrint />
                </Button>
              </Flex>
            </Box>

            <DataTable<SoftControl>
              columns={softControlColumns}
              data={softControls}
              onRowClick={(sc) => handleEdit(sc)}
              headerBg={theme.colors.primary}
              headerColor="white"
              borderColor="white"
              bodyBg={theme.colors.bg}
              editingRowId={editId ?? (highlightedId ?? null)}
              rowIdKey="CTLID"
              emptyText="No SoftControl available"
              pagination={{ enabled: true, pageSize: 10, color: theme.colors.whiteColor }}
            />
          </Box>
        </GridItem>
      </Grid>
    </Box>
  );
}

export default SoftControlMaster;