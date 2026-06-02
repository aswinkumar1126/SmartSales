"use client";

import { useState } from "react";
import {
  Box, Button, Grid, VStack, Text, HStack, Badge, Table,
} from "@chakra-ui/react";
import {
  Database, Layers, FileText, Pencil, Trash2,
  ChevronDown, Eye, Plus, RefreshCw,
} from "lucide-react";
import {
  useModules, useMenu, useSubModules, useContents, 
  useCreateModule, useUpdateModule, useDeleteModule,
  useCreateSubModule, useUpdateSubModule, useDeleteSubModule,
  useCreateContent, useUpdateContent, useDeleteContent,
} from "@/hooks/apiHooks/RoleTran/useRoleTran";
import { useSidebar, type DirectMenuItem, type SectionDirectItem, type MenuGroup } from "@/context/layout/SideBarContext";
import { useTheme } from "@/context/theme/themeContext";
import { toastError } from "@/component/toast/toast";

// ─── Types ──────────────────────────────────────────────────────────────────

type TabKey = "module" | "submodule" | "content" | "view";

// ─── Tab config ──────────────────────────────────────────────────────────────

const TABS: { key: TabKey; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
  { key: "module", label: "Module", icon: <Database size={14} />, color: "#2563EB", bg: "#EFF6FF" },
  { key: "submodule", label: "Sub Module", icon: <Layers size={14} />, color: "#059669", bg: "#ECFDF5" },
  { key: "content", label: "Content", icon: <FileText size={14} />, color: "#7C3AED", bg: "#F5F3FF" },
  { key: "view", label: "View", icon: <Eye size={14} />, color: "#D97706", bg: "#FFFBEB" },
];

// ─── Shared styles ──────────────────────────────────────────────────────────

const SELECT_STYLE: React.CSSProperties = {
  width: "100%",
  height: "38px",
  border: "1px solid #E2E8F0",
  borderRadius: "8px",
  padding: "0 12px",
  fontSize: "13px",
  background: "#fff",
  color: "#1A202C",
  outline: "none",
  cursor: "pointer",
};

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  height: "38px",
  border: "1px solid #E2E8F0",
  borderRadius: "8px",
  padding: "0 12px",
  fontSize: "13px",
  background: "#fff",
  color: "#1A202C",
  outline: "none",
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const FormPanel = ({ children }: { children: React.ReactNode }) => (
  <Box
    w="300px" flexShrink={0}
    bg="white" p={5} rounded="xl"
    borderWidth="1px" borderColor="gray.100"
    boxShadow="0 1px 8px rgba(0,0,0,0.05)"
    h="fit-content"
    position="sticky" top="20px"
  >
    {children}
  </Box>
);

const DataPanel = ({ children }: { children: React.ReactNode }) => (
  <Box flex={1} minW={0}
    bg="white" rounded="xl"
    borderWidth="1px" borderColor="gray.100"
    boxShadow="0 1px 8px rgba(0,0,0,0.05)"
    overflow="hidden"
  >
    {children}
  </Box>
);

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <Text fontSize="11px" fontWeight="700" color="gray.400" textTransform="uppercase" letterSpacing="0.5px" mb={1}>
    {children}
  </Text>
);

const ActionButton = ({
  onClick, color, children,
}: {
  onClick: () => void; color: string; children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: "28px", height: "28px",
      borderRadius: "7px", border: "none",
      background: `${color}15`, color,
      cursor: "pointer", transition: "all 0.15s",
    }}
    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${color}25`; }}
    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${color}15`; }}
  >
    {children}
  </button>
);

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function RoleTranPage() {
  const { menuData } = useSidebar();
  const { theme } = useTheme();

  const [activeTab, setActiveTab] = useState<TabKey>("module");
  const [moduleName, setModuleName] = useState("");
  const [subModuleName, setSubModuleName] = useState("");
  const [contentName, setContentName] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState(0);
  const [selectedSubModuleId, setSelectedSubModuleId] = useState(0);
  const [editingModuleId, setEditingModuleId] = useState<number | null>(null);
  const [editingSubModuleId, setEditingSubModuleId] = useState<number | null>(null);
  const [editingContentId, setEditingContentId] = useState<number | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [expandedSubModules, setExpandedSubModules] = useState<Set<number>>(new Set());

  const [isDirectItem ,setIsDirectItem] = useState<boolean>(false);

  const toggle = (set: Set<number>, id: number): Set<number> => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  };

  // ── API ──────────────────────────────────────────────────────────────────

  const { data: menu = [] } = useMenu();
  const { data: modules = [] } = useModules();
  const { data: subModules = [] } = useSubModules(selectedModuleId);
  const { data: contents = [] } = useContents(selectedSubModuleId ? selectedSubModuleId : selectedModuleId, selectedSubModuleId ? false : true);

  console.log(subModules,'subModules');
  const { mutate: createModule } = useCreateModule();
  const { mutate: updateModule } = useUpdateModule();
  const { mutate: deleteModule } = useDeleteModule();
  const { mutate: createSubModule } = useCreateSubModule();
  const { mutate: updateSubModule } = useUpdateSubModule();
  const { mutate: deleteSubModule } = useDeleteSubModule();
  const { mutate: createContent } = useCreateContent();

  const { mutate: updateContent } = useUpdateContent();
  const { mutate: deleteContent } = useDeleteContent();

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSaveModule = () => {
    if (!moduleName.trim()) return;
    if (modules.some((m)=>m.NAME.toLowerCase() === moduleName.toLowerCase())){
      return toastError("Already Added Module")
    }
    if (editingModuleId) {
      updateModule({ id: editingModuleId, body: { NAME: moduleName, DISPLAYORDER: 1, ACTIVE: true } });
      setEditingModuleId(null);
    } else {
      createModule({ NAME: moduleName, DISPLAYORDER: 1 });
    }
    setModuleName("");
  };

  const handleSaveSubModule = () => {
    if (!subModuleName.trim() || !selectedModuleId) return;
    if (subModules.some((m) => m.NAME.toLowerCase() === subModuleName.toLowerCase() && m.NAVHEADER.ID === Number(selectedModuleId))) {
      return toastError("Already Added Sub Module")
    }
    if (editingSubModuleId) {
      updateSubModule({ id: editingSubModuleId, body: { NAME: subModuleName, DISPLAYORDER: 1, ACTIVE: true } });
      setEditingSubModuleId(null);
    } else {
      createSubModule({ moduleId: selectedModuleId, body: { NAME: subModuleName, DISPLAYORDER: 1 } });
    }
    setSubModuleName("");
  };

  const handleSaveContent = () => {
    if (!contentName.trim() || !selectedModuleId) return;
    const names = contentName.split(",").filter(Boolean);
    console.log(names ,'namesforsavig');

    if (editingContentId) {
      updateContent({
        id: editingContentId, body: {
          NAME: names[0], NAVHEADER: selectedModuleId, ...(selectedSubModuleId && {
            NAVSUBHEADER: selectedSubModuleId,
          }), DISPLAYORDER: 1, ACTIVE: true } });
      setEditingContentId(null);
    } else {
      names.forEach((name, i) => createContent({
        body: {
          NAME: name, 
          NAVHEADER: selectedModuleId, 
          ...(selectedSubModuleId > 0  && {
            NAVSUBHEADER: selectedSubModuleId,
          }),  
          DISPLAYORDER: i + 1 } }));
    }
    setContentName("");
  };

  const resetModuleEdit = () => { setEditingModuleId(null); setModuleName(""); };
  const resetSubEdit = () => { setEditingSubModuleId(null); setSubModuleName(""); };
  const resetContentEdit = () => { setEditingContentId(null); setContentName(""); };

  // ── Sidebar helpers ───────────────────────────────────────────────────────

  // ── Sidebar helpers ───────────────────────────────────────────────────────

  const getSidebarSubModules = (moduleId: number): string[] => {
    const apiModule = modules.find((m) => m.ID === moduleId);
    if (!apiModule) return [];
    const section = menuData[apiModule.NAME];
    if (!section) return [];

    // Return only group names (keys where the value is a MenuGroup, not a direct item)
    return Object.entries(section)
      .filter(([, val]) => !("type" in val)) // MenuGroup has no `type`
      .map(([key]) => key);
  };

  const getSidebarItems = (
    moduleId: number,
    subModuleId: number
  ): DirectMenuItem[] => {
    const apiModule = modules.find((m) => m.ID === moduleId);
    const apiSubModule = subModules.find((s) => s.ID === subModuleId);

    if (!apiModule) return [];

    const section = menuData[apiModule.NAME];
    if (!section) return [];

    const values = Object.values(section);

    const directItems = values.filter(
      (v): v is DirectMenuItem => "type" in v && v.type === "direct"
    );

    // CASE 1: no submodule → show direct only
    if (!subModuleId) {
      return directItems;
    }

    // CASE 2: submodule selected → show group items
    if (apiSubModule) {
      const group = section[apiSubModule.NAME];

      if (group && Array.isArray((group as any).items)) {
        return (group as MenuGroup).items.filter(
          (i): i is DirectMenuItem => i.type === "direct"
        );
      }
    }

    return [];
  };

  const toggleContentItem = (label: string) => {
    const current = contentName ? contentName.split(",") : [];
    const updated = current.includes(label) ? current.filter((i) => i !== label) : [...current, label];
    setContentName(updated.join(","));
  };

  const activeConfig = TABS.find((t) => t.key === activeTab)!;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Box>
      <VStack align="stretch" gap={2}>

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <Box
          bg="white" p={2} rounded="xl"
          borderWidth="1px" borderColor="gray.100"
          boxShadow="0 1px 8px rgba(0,0,0,0.05)"
          position="relative" overflow="hidden"
        >
          <Box
            position="absolute"
            bg={activeConfig.color} borderLeftRadius="xl"
          />
          <HStack justify="space-between" align="center">
            <Box>
              <Text fontSize="xl" fontWeight="800" color="gray.800" >
                Role Transaction
              </Text>
              <Text color="gray.400" fontSize="12.5px">
                Manage Modules, Sub Modules & Contents
              </Text>
            </Box>
            <Badge px={3} py={1} borderRadius="full" fontSize="11px" fontWeight="600" colorPalette="blue">
              {modules.length} Modules
            </Badge>
          </HStack>
        </Box>

        {/* ── TABS ───────────────────────────────────────────────────────── */}
        <Box
          bg="white" px={2} py={1.5} rounded="xl"
          borderWidth="1px" borderColor="gray.100"
          boxShadow="0 1px 8px rgba(0,0,0,0.05)"
        >
          <HStack gap={1}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <Box
                  key={tab.key} flex={1} px={3} py={2} rounded="lg"
                  cursor="pointer"
                  bg={isActive ? tab.color : "transparent"}
                  color={isActive ? "white" : "gray.500"}
                  transition="all 0.2s"
                  _hover={{ bg: isActive ? tab.color : tab.bg, color: isActive ? "white" : "gray.700" }}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <HStack justify="center" gap={1.5}>
                    {tab.icon}
                    <Text fontSize="13px" fontWeight={isActive ? "700" : "500"}>{tab.label}</Text>
                  </HStack>
                </Box>
              );
            })}
          </HStack>
        </Box>

        {/* ── MODULE TAB ─────────────────────────────────────────────────── */}
        {activeTab === "module" && (
          <HStack align="start" gap={4}>
            {/* LEFT: Form */}
            <FormPanel>
              <VStack align="stretch" gap={4}>
                <HStack justify="space-between" align="center">
                  <Text fontWeight="700" fontSize="13.5px" color="gray.700">
                    {editingModuleId ? "Edit Module" : "New Module"}
                  </Text>
                  {editingModuleId && (
                    <button onClick={resetModuleEdit} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: "11px", display: "flex", alignItems: "center", gap: 4 }}>
                      <RefreshCw size={11} /> Reset
                    </button>
                  )}
                </HStack>

                <Box>
                  <FieldLabel>Select Module</FieldLabel>
                  <select value={moduleName} onChange={(e) => setModuleName(e.target.value)} style={SELECT_STYLE}>
                    <option value="">Choose from Sidebar</option>
                    {Object.keys(menuData).map((key) => (
                      <option key={key} value={key}>{key}</option>
                    ))}
                  </select>
                </Box>

                <Button
                  height="38px" borderRadius="8px" fontWeight="600" fontSize="13px" w="full"
                  colorScheme={editingModuleId ? "orange" : "blue"}
                  onClick={handleSaveModule}
                  disabled={!moduleName.trim()}
                >
                  <HStack gap={1.5}>
                    {editingModuleId ? <RefreshCw size={13} /> : <Plus size={13} />}
                    <span>{editingModuleId ? "Update Module" : "Create Module"}</span>
                  </HStack>
                </Button>
              </VStack>
            </FormPanel>

            {/* RIGHT: Data */}
            <DataPanel>
              <HStack px={5} py={3.5} borderBottom="1px solid #F1F5F9" justify="space-between">
                <Text fontWeight="700" fontSize="13px" color="gray.600">All Modules</Text>
                <Badge colorPalette="blue" px={2.5} py={0.5} borderRadius="full" fontSize="11px">
                  {modules.length} records
                </Badge>
              </HStack>
              <StyledTable headers={["#", "Module Name", "Status", "Actions"]} empty={modules.length === 0}>
                {modules.map((item, idx) => (
                  <Table.Row key={item.ID} _hover={{ bg: "gray.50" }} transition="background 0.15s">
                    <Table.Cell color="gray.400" fontSize="12px" w="40px">{idx + 1}</Table.Cell>
                    <Table.Cell fontWeight="600" fontSize="13.5px">{item.NAME}</Table.Cell>
                    <Table.Cell>
                      <Badge colorPalette={item.ACTIVE ? "green" : "red"} px={2.5} py={0.5} borderRadius="full" fontSize="11px">
                        {item.ACTIVE ? "Active" : "Inactive"}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <HStack gap={1.5}>
                        <ActionButton color="#2563EB" onClick={() => { setEditingModuleId(item.ID); setModuleName(item.NAME); }}>
                          <Pencil size={12} />
                        </ActionButton>
                        <ActionButton color="#DC2626" onClick={() => deleteModule(item.ID)}>
                          <Trash2 size={12} />
                        </ActionButton>
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </StyledTable>
            </DataPanel>
          </HStack>
        )}

        {/* ── SUB MODULE TAB ─────────────────────────────────────────────── */}
        {activeTab === "submodule" && (
          <HStack align="start" gap={4}>
            {/* LEFT: Form */}
            <FormPanel>
              <VStack align="stretch" gap={4}>
                <HStack justify="space-between" align="center">
                  <Text fontWeight="700" fontSize="13.5px" color="gray.700">
                    {editingSubModuleId ? "Edit Sub Module" : "New Sub Module"}
                  </Text>
                  {editingSubModuleId && (
                    <button onClick={resetSubEdit} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: "11px", display: "flex", alignItems: "center", gap: 4 }}>
                      <RefreshCw size={11} /> Reset
                    </button>
                  )}
                </HStack>

                <Box>
                  <FieldLabel>Module</FieldLabel>
                  <select
                    value={selectedModuleId}
                    onChange={(e) => { setSelectedModuleId(Number(e.target.value)); setSubModuleName(""); }}
                    style={SELECT_STYLE}
                  >
                    <option value="0">Select Module</option>
                    {modules.map((item) => (
                      <option key={item.ID} value={item.ID}>{item.NAME}</option>
                    ))}
                  </select>
                </Box>

                {selectedModuleId > 0 && (
                  <Box>
                    <FieldLabel>Sub Module</FieldLabel>
                    <select value={subModuleName} onChange={(e) => setSubModuleName(e.target.value)} style={SELECT_STYLE}>
                      <option value="">Choose from Sidebar</option>
                      {getSidebarSubModules(selectedModuleId).map((sub) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </Box>
                )}

                <Button
                  height="38px" borderRadius="8px" fontWeight="600" fontSize="13px" w="full"
                  colorScheme={editingSubModuleId ? "orange" : "green"}
                  onClick={handleSaveSubModule}
                  disabled={!subModuleName.trim() || !selectedModuleId}
                >
                  <HStack gap={1.5}>
                    {editingSubModuleId ? <RefreshCw size={13} /> : <Plus size={13} />}
                    <span>{editingSubModuleId ? "Update" : "Create"}</span>
                  </HStack>
                </Button>
              </VStack>
            </FormPanel>

            {/* RIGHT: Data */}
            <DataPanel>
              <HStack px={5} py={3.5} borderBottom="1px solid #F1F5F9" justify="space-between">
                <Text fontWeight="700" fontSize="13px" color="gray.600">All Sub Modules</Text>
                <Badge colorPalette="green" px={2.5} py={0.5} borderRadius="full" fontSize="11px">
                  {subModules.length} records
                </Badge>
              </HStack>
              <StyledTable headers={["#", "Sub Module", "Module", "Actions"]} empty={subModules.length === 0}>
                {subModules.map((item, idx) => (
                  <Table.Row key={item.ID} _hover={{ bg: "gray.50" }} transition="background 0.15s">
                    <Table.Cell color="gray.400" fontSize="12px" w="40px">{idx + 1}</Table.Cell>
                    <Table.Cell fontWeight="600" fontSize="13.5px">{item.NAME}</Table.Cell>
                    <Table.Cell>
                      <Badge colorPalette="blue" px={2.5} py={0.5} borderRadius="full" fontSize="11px">
                        {item.NAVHEADER?.NAME}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <HStack gap={1.5}>
                        <ActionButton color="#2563EB" onClick={() => { setEditingSubModuleId(item.ID); setSubModuleName(item.NAME); }}>
                          <Pencil size={12} />
                        </ActionButton>
                        <ActionButton color="#DC2626" onClick={() => deleteSubModule(item.ID)}>
                          <Trash2 size={12} />
                        </ActionButton>
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </StyledTable>
            </DataPanel>
          </HStack>
        )}

        {/* ── CONTENT TAB ────────────────────────────────────────────────── */}
        {activeTab === "content" && (
          <HStack align="start" gap={4}>
            {/* LEFT: Form */}
            <FormPanel>
              <VStack align="stretch" gap={4}>
                <HStack justify="space-between" align="center">
                  <Text fontWeight="700" fontSize="13.5px" color="gray.700">
                    {editingContentId ? "Edit Content" : "New Content"}
                  </Text>
                  {editingContentId && (
                    <button onClick={resetContentEdit} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: "11px", display: "flex", alignItems: "center", gap: 4 }}>
                      <RefreshCw size={11} /> Reset
                    </button>
                  )}
                </HStack>

                <Box>
                  <FieldLabel>Module</FieldLabel>
                  <select
                    value={selectedModuleId}
                    onChange={(e) => { setSelectedModuleId(Number(e.target.value)); setSelectedSubModuleId(0); setContentName(""); }}
                    style={SELECT_STYLE}
                  >
                    <option value="0">Select Module</option>
                    {modules.map((item) => (
                      <option key={item.ID} value={item.ID}>{item.NAME}</option>
                    ))}
                  </select>
                </Box>

                {selectedModuleId > 0 && (
                  <Box>
                    <FieldLabel>Sub Module <span style={{ color: "#9CA3AF", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></FieldLabel>
                    <select
                      value={selectedSubModuleId}
                      onChange={(e) => { setSelectedSubModuleId(Number(e.target.value)); setContentName(""); }}
                      style={SELECT_STYLE}
                    >
                      <option value="0">None</option>
                      {subModules.map((item) => (
                        <option key={item.ID} value={item.ID}>{item.NAME}</option>
                      ))}
                    </select>
                  </Box>
                )}

                {/* Checkbox picker */}
                {selectedModuleId > 0 && (() => {
                  const mod = modules.find((m) => m.ID === selectedModuleId);
                  const section = mod ? menuData[mod.NAME] : null;

                  const directItems = Object.values(section ?? {}).filter(
                    (v): v is DirectMenuItem => "type" in v && v?.type === "direct"
                  );

                  const groups = Object.values(section ?? {}).filter(
                    (v): v is MenuGroup => "items" in v &&  Array.isArray(v?.items)
                  );

                  const showPicker =
                    directItems.length > 0 || (groups.length > 0 && selectedSubModuleId > 0);


                  if (!showPicker) return null;

                  const items = getSidebarItems(selectedModuleId, selectedSubModuleId);
                  const selectedNames = contentName ? contentName.split(",") : [];

                  return (
                    <Box>
                      <FieldLabel>
                        Select Items
                        {selectedNames.length > 0 && (
                          <span style={{ marginLeft: 6, background: "#7C3AED", color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 10 }}>
                            {selectedNames.length}
                          </span>
                        )}
                      </FieldLabel>
                      <Box
                        border="1px solid #E2E8F0" borderRadius="8px"
                        maxH="200px" overflowY="auto" bg="#FAFAFA"
                      >
                        {items.length > 0 ? (
                          <VStack align="stretch" gap={0} p={2}>
                            {items.map((item) => {
                              const checked = selectedNames.includes(item.label);
                              return (
                                <label
                                  key={item.route}
                                  style={{
                                    display: "flex", alignItems: "center", gap: 8,
                                    cursor: "pointer", padding: "5px 8px",
                                    borderRadius: 6,
                                    background: checked ? "#EDE9FE" : "transparent",
                                    fontSize: 12.5,
                                    color: checked ? "#5B21B6" : "#374151",
                                    fontWeight: checked ? 600 : 400,
                                    transition: "all 0.15s",
                                  }}
                                >
                                  <input
                                    type="checkbox" checked={checked}
                                    onChange={() => toggleContentItem(item.label)}
                                    style={{ accentColor: "#8B5CF6", width: 13, height: 13 }}
                                  />
                                  {item.label}
                                </label>
                              );
                            })}
                          </VStack>
                        ) : (
                          <Text color="gray.400" fontSize="12px" textAlign="center" py={4}>
                            No items available
                          </Text>
                        )}
                      </Box>
                    </Box>
                  );
                })()}

                <Button
                  height="38px" borderRadius="8px" fontWeight="600" fontSize="13px" w="full"
                  colorScheme={editingContentId ? "orange" : "purple"}
                  onClick={handleSaveContent}
                  disabled={!contentName.trim() || !selectedModuleId}
                >
                  <HStack gap={1.5}>
                    {editingContentId ? <RefreshCw size={13} /> : <Plus size={13} />}
                    <span>{editingContentId ? "Update" : "Create"}</span>
                  </HStack>
                </Button>
              </VStack>
            </FormPanel>

            {/* RIGHT: Data */}
            <DataPanel>
              <HStack px={5} py={3.5} borderBottom="1px solid #F1F5F9" justify="space-between">
                <Text fontWeight="700" fontSize="13px" color="gray.600">All Contents</Text>
                <Badge colorPalette="purple" px={2.5} py={0.5} borderRadius="full" fontSize="11px">
                  {contents.length} records
                </Badge>
              </HStack>
              <StyledTable headers={["#", "Content Name", "Sub Module", "Actions"]} empty={contents.length === 0}>
                {contents.map((item, idx) => (
                  <Table.Row key={item.ID} _hover={{ bg: "gray.50" }} transition="background 0.15s">
                    <Table.Cell color="gray.400" fontSize="12px" w="40px">{idx + 1}</Table.Cell>
                    <Table.Cell fontWeight="600" fontSize="13.5px">{item.NAME}</Table.Cell>
                    <Table.Cell>
                      {item.SUBMODULE?.NAME
                        ? <Badge colorPalette="purple" px={2.5} py={0.5} borderRadius="full" fontSize="11px">{item.SUBMODULE.NAME}</Badge>
                        : <Text fontSize="12px" color="gray.400">—</Text>
                      }
                    </Table.Cell>
                    <Table.Cell>
                      <HStack gap={1.5}>
                        <ActionButton color="#2563EB" onClick={() => { setEditingContentId(item.ID); setContentName(item.NAME); }}>
                          <Pencil size={12} />
                        </ActionButton>
                        <ActionButton color="#DC2626" onClick={() => deleteContent(item.ID)}>
                          <Trash2 size={12} />
                        </ActionButton>
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </StyledTable>
            </DataPanel>
          </HStack>
        )}

        {/* ── VIEW TAB ───────────────────────────────────────────────────── */}
        {activeTab === "view" && (
          <Box>
            <Box
              bg="white"
              rounded="2xl"
              borderWidth="1px"
              borderColor="gray.100"
              boxShadow="0 4px 18px rgba(0,0,0,0.05)"
              overflow="hidden"
            >
              {/* Header */}
              <HStack
                px={5}
                py={4}
                justify="space-between"
                borderBottom="1px solid #F1F5F9"
                bg="linear-gradient(90deg,#F8FAFC,#FFFFFF)"
              >
                <Box>
                  <Text fontWeight="800" fontSize="15px" color="gray.700">
                    Module Hierarchy
                  </Text>
                  <Text fontSize="12px" color="gray.400">
                    Expand modules and sub modules to explore contents
                  </Text>
                </Box>

                <Badge
                  colorPalette="orange"
                  px={3}
                  py={1}
                  borderRadius="full"
                  fontSize="11px"
                  fontWeight="700"
                >
                  {menu.length} Modules
                </Badge>
              </HStack>

              {/* Body */}
              <VStack align="stretch" gap={3} p={4}>
                {menu.length === 0 && (
                  <Box py={12} textAlign="center">
                    <Text color="gray.400" fontSize="13px">
                      No hierarchy data available
                    </Text>
                  </Box>
                )}

                {menu.map((mod) => {
                  const modExpanded = expandedModules.has(mod.ID);

                  return (
                    <Box
                      key={mod.ID}
                      borderWidth="1px"
                      borderColor={modExpanded ? "#BFDBFE" : "gray.100"}
                      rounded="xl"
                      overflow="hidden"
                      transition="all 0.2s"
                      boxShadow={
                        modExpanded
                          ? "0 6px 18px rgba(37,99,235,0.08)"
                          : "0 1px 4px rgba(0,0,0,0.03)"
                      }
                    >
                      {/* MODULE HEADER */}
                      <HStack
                        px={4}
                        py={3}
                        justify="space-between"
                        cursor="pointer"
                        bg={
                          modExpanded
                            ? "linear-gradient(90deg,#EFF6FF,#F8FBFF)"
                            : "white"
                        }
                        transition="all 0.2s"
                        _hover={{
                          bg: "#F8FAFC",
                        }}
                        onClick={() =>
                          setExpandedModules(toggle(expandedModules, mod.ID))
                        }
                      >
                        <HStack align="start" gap={3}>
                          <Box
                            p={2}
                            bg="#DBEAFE"
                            color="#2563EB"
                            rounded="lg"
                            mt="1px"
                          >
                            <Database size={15} />
                          </Box>

                          <Box>
                            <HStack gap={2} mb={1}>
                              <Text
                                fontWeight="700"
                                fontSize="14px"
                                color="gray.800"
                              >
                                {mod.NAME}
                              </Text>

                              <Badge
                                colorPalette="blue"
                                borderRadius="full"
                                fontSize="10px"
                                px={2}
                              >
                                {mod.SUBMODULES.length} Sub
                              </Badge>

                              <Badge
                                colorPalette="purple"
                                borderRadius="full"
                                fontSize="10px"
                                px={2}
                              >
                                {mod.CONTENTS.length +
                                  mod.SUBMODULES.reduce(
                                    (acc, s) => acc + s.CONTENTS.length,
                                    0
                                  )}{" "}
                                Contents
                              </Badge>
                            </HStack>

                            <Text fontSize="11px" color="gray.500">
                              Click to expand hierarchy details
                            </Text>
                          </Box>
                        </HStack>

                        <Box
                          transition="all 0.25s"
                          transform={
                            modExpanded ? "rotate(0deg)" : "rotate(-90deg)"
                          }
                          color="#2563EB"
                        >
                          <ChevronDown size={18} />
                        </Box>
                      </HStack>

                      {/* MODULE CONTENT */}
                      {modExpanded && (
                        <Box
                          px={4}
                          pb={4}
                          bg="#FCFCFD"
                          borderTop="1px solid #EEF2F7"
                        >
                          {/* DIRECT CONTENTS */}
                          {mod.CONTENTS.length > 0 && (
                            <Box mb={4} mt={4}>
                              <Text
                                fontSize="10px"
                                fontWeight="700"
                                color="gray.400"
                                textTransform="uppercase"
                                mb={2}
                                letterSpacing="0.6px"
                              >
                                Direct Contents
                              </Text>

                              <HStack wrap="wrap" gap={2}>
                                {mod.CONTENTS.map((c) => (
                                  <Badge
                                    key={c.ID}
                                    px={3}
                                    py={1}
                                    borderRadius="full"
                                    bg="#F3E8FF"
                                    color="#6B21A8"
                                    fontSize="11px"
                                    fontWeight="600"
                                  >
                                    {c.NAME}
                                  </Badge>
                                ))}
                              </HStack>
                            </Box>
                          )}

                          {/* SUB MODULES */}
                          <VStack align="stretch" gap={3}>
                            {mod.SUBMODULES.map((sub) => {
                              const subExpanded = expandedSubModules.has(sub.ID);

                              return (
                                <Box
                                  key={sub.ID}
                                  borderWidth="1px"
                                  borderColor={
                                    subExpanded ? "#A7F3D0" : "#E5E7EB"
                                  }
                                  rounded="lg"
                                  overflow="hidden"
                                  bg="white"
                                >
                                  {/* SUB HEADER */}
                                  <HStack
                                    px={3}
                                    py={2.5}
                                    justify="space-between"
                                    cursor="pointer"
                                    bg={subExpanded ? "#ECFDF5" : "white"}
                                    transition="all 0.2s"
                                    _hover={{
                                      bg: "#F9FAFB",
                                    }}
                                    onClick={() =>
                                      setExpandedSubModules(
                                        toggle(expandedSubModules, sub.ID)
                                      )
                                    }
                                  >
                                    <HStack gap={2}>
                                      <Box
                                        p={1.5}
                                        bg="#D1FAE5"
                                        color="#059669"
                                        rounded="md"
                                      >
                                        <Layers size={12} />
                                      </Box>

                                      <Box>
                                        <Text
                                          fontSize="12.5px"
                                          fontWeight="700"
                                          color="gray.700"
                                        >
                                          {sub.NAME}
                                        </Text>

                                        <Text
                                          fontSize="10px"
                                          color="gray.400"
                                        >
                                          {sub.CONTENTS.length} contents
                                        </Text>
                                      </Box>
                                    </HStack>

                                    <HStack gap={2}>
                                      <Badge
                                        colorPalette="green"
                                        borderRadius="full"
                                        px={2}
                                        fontSize="10px"
                                      >
                                        {sub.CONTENTS.length}
                                      </Badge>

                                      <Box
                                        transition="all 0.25s"
                                        transform={
                                          subExpanded
                                            ? "rotate(0deg)"
                                            : "rotate(-90deg)"
                                        }
                                        color="#059669"
                                      >
                                        <ChevronDown size={15} />
                                      </Box>
                                    </HStack>
                                  </HStack>

                                  {/* SUB CONTENTS */}
                                  {subExpanded && (
                                    <Box
                                      px={4}
                                      py={3}
                                      borderTop="1px solid #F3F4F6"
                                      bg="#FAFAFA"
                                    >
                                      {sub.CONTENTS.length > 0 ? (
                                        <Grid
                                          templateColumns={{
                                            base: "repeat(1,1fr)",
                                            md: "repeat(2,1fr)",
                                            lg: "repeat(3,1fr)",
                                          }}
                                          gap={2}
                                        >
                                          {sub.CONTENTS.map((c) => (
                                            <HStack
                                              key={c.ID}
                                              px={3}
                                              py={2}
                                              bg="white"
                                              borderWidth="1px"
                                              borderColor="gray.100"
                                              rounded="lg"
                                              justify="space-between"
                                            >
                                              <HStack gap={2}>
                                                <Box
                                                  w="7px"
                                                  h="7px"
                                                  bg="#8B5CF6"
                                                  rounded="full"
                                                />
                                                <Text
                                                  fontSize="12px"
                                                  fontWeight="500"
                                                  color="gray.700"
                                                >
                                                  {c.NAME}
                                                </Text>
                                              </HStack>

                                              <FileText
                                                size={12}
                                                color="#8B5CF6"
                                              />
                                            </HStack>
                                          ))}
                                        </Grid>
                                      ) : (
                                        <Box
                                          textAlign="center"
                                          py={4}
                                          color="gray.400"
                                          fontSize="12px"
                                        >
                                          No contents available
                                        </Box>
                                      )}
                                    </Box>
                                  )}
                                </Box>
                              );
                            })}
                          </VStack>
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </VStack>
            </Box>
          </Box>
        )}

      </VStack>
    </Box>
  );
}

// ─── Shared Table wrapper ──────────────────────────────────────────────────

function StyledTable({
  headers, children, empty,
}: {
  headers: string[];
  children: React.ReactNode;
  empty: boolean;
}) {
  return (
    <Table.Root>
      <Table.Header>
        <Table.Row bg="gray.50">
          {headers.map((h) => (
            <Table.ColumnHeader
              key={h}
              fontSize="10.5px" fontWeight="700" color="gray.400"
              textTransform="uppercase" letterSpacing="0.5px"
              py={2.5} px={4}
            >
              {h}
            </Table.ColumnHeader>
          ))}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {empty ? (
          <Table.Row>
            <Table.Cell colSpan={headers.length} textAlign="center" py={10} color="gray.400" fontSize="13px">
              No records found
            </Table.Cell>
          </Table.Row>
        ) : children}
      </Table.Body>
    </Table.Root>
  );
}