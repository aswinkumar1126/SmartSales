"use client";

import React, {
  useState, useEffect, useMemo, useCallback, memo,
} from "react";
import {
  Box, Button, Flex, Tabs, VStack, HStack, Text,
  Spinner, Badge, Grid, GridItem,
} from "@chakra-ui/react";
import { Table } from "@chakra-ui/react/table";
import {
  ChevronRight, ChevronDown, Plus, Trash2,
  ShieldCheck, Eye, CheckSquare, AlertCircle, Edit2,
} from "lucide-react";

import { CustomTable, TableColumn } from "@/component/table/CustomTable";
import { toastError, toastCreated }  from "@/component/toast/toast";

import {
  useRoleTransactions, useInsertRoleTransaction,
  useDeleteRoleTransaction, useToggleRoleTransactionActive, useMenu,
} from "@/hooks/apiHooks/RoleTran/useRoleTran";
import { RoleTran }  from "@/types/RoleTran/RoleTran";
import { useRole } from "@/hooks/apiHooks/RoleMaster/useRoleMaster";
import { useTheme } from "@/context/theme/themeContext";

// ─── Design tokens ────────────────────────────────────────────────────────────

const T = {
  navy:        "#0F2544",
  navyMID:     "#1E3A5F",
  navyLight:   "#2D5282",
  accent:      "#3B82F6",
  accentLight: "#EFF6FF",
  accentMID:   "#BFDBFE",
  green:       "#10B981",
  greenLight:  "#D1FAE5",
  red:         "#EF4444",
  redLight:    "#FEE2E2",
  orange:      "#F59E0B",
  text:        "#0F172A",
  textMID:     "#374151",
  textSub:     "#64748B",
  textMuted:   "#94A3B8",
  border:      "#E2E8F0",
  borderMID:   "#CBD5E0",
  bg:          "#F8FAFC",
  bgCard:      "#FFFFFF",
  bgHover:     "#F1F5F9",
  radius:      "8px",
  radiusMd:    "10px",
  radiusLg:    "12px",
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContentNode   { ID: number; NAME: string }
interface SubModuleNode { ID: number; NAME: string; CONTENTS: ContentNode[] }
interface ModuleNode    { ID: number; NAME: string; CONTENTS: ContentNode[]; subModules: SubModuleNode[] }
type CheckState = "none" | "some" | "all";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCheckState(IDs: number[], selected: Set<number>): CheckState {
  if (!IDs.length) return "none";
  const n = IDs.filter(ID => selected.has(ID)).length;
  return n === 0 ? "none" : n === IDs.length ? "all" : "some";
}

// ─── TriCheckbox ──────────────────────────────────────────────────────────────

const TriCheckbox = memo(({ state, onChange }: { state: CheckState; onChange: () => void }) => (
  <input
    type="checkbox"
    ref={el => { if (el) el.indeterminate = state === "some"; }}
    checked={state === "all"}
    onChange={onChange}
    style={{ cursor: "pointer", width: 13, height: 13, accentColor: T.accent, flexShrink: 0 }}
  />
));
TriCheckbox.displayName = "TriCheckbox";

// ─── ContentRow ───────────────────────────────────────────────────────────────

const ContentRow = memo(({ content, selected, onToggle }: {
  content: ContentNode; selected: boolean; onToggle: (ID: number) => void;
}) => (
  <label style={{
    display: "flex", alignItems: "center", gap: 8,
    padding: "4px 10px 4px 42px", cursor: "pointer", borderRadius: 6,
    background: selected ? T.accentLight : "transparent",
    fontSize: 12.5, userSelect: "none",
    transition: "background 0.12s",
  }}>
    <input
      type="checkbox" checked={selected} onChange={() => onToggle(content.ID)}
      style={{ cursor: "pointer", width: 13, height: 13, accentColor: T.accent, flexShrink: 0 }}
    />
    <span style={{ color: selected ? "#1D4ED8" : T.textMID, transition: "color 0.12s" }}>
      {content.NAME}
    </span>
  </label>
));
ContentRow.displayName = "ContentRow";

// ─── SubModuleRow ─────────────────────────────────────────────────────────────

const SubModuleRow = memo(({ sub, selected, onToggleContent, onToggleGroup, forceOpen }: {
  sub: SubModuleNode; selected: Set<number>;
  onToggleContent: (ID: number) => void;
  onToggleGroup: (IDs: number[]) => void;
  forceOpen?: boolean;
}) => {
  const [open, setOpen] = useState(forceOpen ?? true);
  useEffect(() => { if (forceOpen !== undefined) setOpen(forceOpen); }, [forceOpen]);

  const IDs = useMemo(() => sub.CONTENTS.map(c => c.ID), [sub.CONTENTS]);
  const state = getCheckState(IDs, selected);
  const checkedCount = IDs.filter(ID => selected.has(ID)).length;

  return (
    <Box>
      <Flex
        align="center" gap={1.5} px={2} py="5px" cursor="pointer"
        borderRadius={6} _hover={{ bg: T.bgHover }}
        style={{ paddingLeft: 20 }}
        transition="background 0.12s"
      >
        <Box
          as="span" onClick={() => setOpen(o => !o)}
          style={{ display: "flex", alignItems: "center", color: T.textSub, flexShrink: 0 }}
        >
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </Box>
        <TriCheckbox state={state} onChange={() => onToggleGroup(IDs)} />
        <Text
          fontSize="xs" fontWeight="semibold" color={state !== "none" ? T.accent : T.textSub}
          ml={1} onClick={() => setOpen(o => !o)}
          style={{ cursor: "pointer", userSelect: "none", flex: 1 }}
          transition="color 0.12s"
        >
          📁 {sub.NAME}
        </Text>
        {state !== "none" && (
          <Box
            px={1.5} py="1px" borderRadius={10} fontSize="10px" fontWeight={600}
            bg={T.accentLight} color={T.accent}
          >
            {checkedCount}/{IDs.length}
          </Box>
        )}
      </Flex>
      {open && (
        <Box>
          {sub.CONTENTS.map(c => (
            <ContentRow key={c.ID} content={c} selected={selected.has(c.ID)} onToggle={onToggleContent} />
          ))}
        </Box>
      )}
    </Box>
  );
});
SubModuleRow.displayName = "SubModuleRow";

// ─── ModuleRow ────────────────────────────────────────────────────────────────

const ModuleRow = memo(({ mod, selected, onToggleContent, onToggleGroup, forceOpen, expandedSubIDs }: {
  mod: ModuleNode; selected: Set<number>;
  onToggleContent: (ID: number) => void;
  onToggleGroup: (IDs: number[]) => void;
  forceOpen?: boolean;
  expandedSubIDs?: Set<number>;
}) => {
  const [open, setOpen] = useState(forceOpen ?? true);
  useEffect(() => { if (forceOpen !== undefined) setOpen(forceOpen); }, [forceOpen]);

  const allIDs = useMemo(() => [
    ...mod.CONTENTS.map(c => c.ID),
    ...mod.subModules.flatMap(s => s.CONTENTS.map(c => c.ID)),
  ], [mod]);

  const state = getCheckState(allIDs, selected);
  const checkedCount = allIDs.filter(ID => selected.has(ID)).length;

  return (
    <Box
      mb={1.5}
      border={`1px solID ${state !== "none" ? T.accentMID : T.border}`}
      borderRadius={T.radiusMd} overflow="hIDden"
      transition="border-color 0.15s"
      boxShadow={state !== "none" ? "0 0 0 2px rgba(59,130,246,0.08)" : "none"}
    >
      <Flex
        align="center" gap={2} px={3} py="7px"
        bg={state !== "none" ? T.accentLight : T.bg}
        cursor="pointer"
        _hover={{ bg: state !== "none" ? "#DBEAFE" : T.bgHover }}
        transition="background 0.12s"
      >
        <Box
          as="span" onClick={() => setOpen(o => !o)}
          style={{ display: "flex", alignItems: "center", color: T.textSub, flexShrink: 0 }}
        >
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </Box>
        <TriCheckbox state={state} onChange={() => onToggleGroup(allIDs)} />
        <Text
          fontSize="xs" fontWeight="bold"
          color={state !== "none" ? "#1E40AF" : T.textMID}
          ml={1} flex={1}
          onClick={() => setOpen(o => !o)}
          style={{ cursor: "pointer", userSelect: "none" }}
          transition="color 0.12s"
        >
          {mod.NAME}
        </Text>
        {state !== "none" && (
          <Box
            px={2} py="2px" borderRadius={10} fontSize="10px" fontWeight={700}
            bg="#DBEAFE" color="#1E40AF"
          >
            {checkedCount}/{allIDs.length}
          </Box>
        )}
      </Flex>
      {open && (
        <Box py={1} bg={T.bgCard}>
          {mod.CONTENTS.map(c => (
            <ContentRow key={c.ID} content={c} selected={selected.has(c.ID)} onToggle={onToggleContent} />
          ))}
          {mod.subModules.map(sub => (
            <SubModuleRow
              key={sub.ID} sub={sub} selected={selected}
              onToggleContent={onToggleContent} onToggleGroup={onToggleGroup}
              forceOpen={expandedSubIDs ? expandedSubIDs.has(sub.ID) : true}
            />
          ))}
        </Box>
      )}
    </Box>
  );
});
ModuleRow.displayName = "ModuleRow";

// ─── ModuleTree ───────────────────────────────────────────────────────────────

const ModuleTree = memo(({ menuData, selectedContentIDs, onToggleContent, onToggleGroup, expandedModuleIDs, expandedSubIDs }: {
  menuData: ModuleNode[]; selectedContentIDs: Set<number>;
  onToggleContent: (ID: number) => void; onToggleGroup: (IDs: number[]) => void;
  expandedModuleIDs?: Set<number>; expandedSubIDs?: Set<number>;
}) => {
  const allIDs = useMemo(() =>
    menuData.flatMap(m => [
      ...m.CONTENTS.map(c => c.ID),
      ...m.subModules.flatMap(s => s.CONTENTS.map(c => c.ID)),
    ]), [menuData]);

  const rootState = getCheckState(allIDs, selectedContentIDs);
  const totalSelected = allIDs.filter(ID => selectedContentIDs.has(ID)).length;

  return (
    <Box>
      <Flex
        align="center" gap={2} px={3} py="6px" mb={2}
        bg={T.bg} borderRadius={T.radius} border={`1px solID ${T.border}`}
      >
        <TriCheckbox state={rootState} onChange={() => onToggleGroup(allIDs)} />
        <Text fontSize="xs" fontWeight="bold" color={T.textMID} flex={1}>Select All</Text>
        {totalSelected > 0 && (
          <Box px={2} py="2px" borderRadius={10} fontSize="10px" fontWeight={700} bg={T.accentLight} color={T.accent}>
            {totalSelected} / {allIDs.length}
          </Box>
        )}
      </Flex>
      {menuData.map(mod => (
        <ModuleRow
          key={mod.ID} mod={mod} selected={selectedContentIDs}
          onToggleContent={onToggleContent} onToggleGroup={onToggleGroup}
          forceOpen={expandedModuleIDs ? expandedModuleIDs.has(mod.ID) : true}
          expandedSubIDs={expandedSubIDs}
        />
      ))}
    </Box>
  );
});
ModuleTree.displayName = "ModuleTree";

// ─── MergedViewTable ──────────────────────────────────────────────────────────

interface FlatRow {
  sno?: number; moduleNAME: string; subModuleNAME: string;
  contentNAME: string; active?: boolean;
}

function buildFlatRows(txs: RoleTran[]): FlatRow[] {
  return [...txs]
    .sort((a, b) => {
      const m = a.MODULENAME.localeCompare(b.MODULENAME);
      if (m) return m;
      const s = (a.SUBMODULENAME || "").localeCompare(b.SUBMODULENAME || "");
      if (s) return s;
      return a.CONTENTNAME.localeCompare(b.CONTENTNAME);
    })
    .map(tx => ({
      sno: tx.SNO,
      moduleNAME:    tx.MODULENAME,
      subModuleNAME: tx.SUBMODULENAME || "—",
      contentNAME:   tx.CONTENTNAME,
      active:        tx.ACTIVE,
    }));
}

// Compute rowspan array: null = skip cell (covered by rowspan above)
function computeSpans<T>(rows: T[], key: (r: T, i: number) => string): (number | null)[] {
  return rows.map((row, i) => {
    if (i === 0 || key(rows[i - 1], i - 1) !== key(row, i)) {
      let span = 1;
      for (let j = i + 1; j < rows.length && key(rows[j], j) === key(row, i); j++) span++;
      return span;
    }
    return null;
  });
}

const MergedViewTable = memo(({ txs, onToggle, onDelete, isToggling, isDeleting }: {
  txs: RoleTran[]; onToggle: (sno: number) => void; onDelete: (sno: number) => void;
  isToggling: boolean; isDeleting: boolean;
}) => {
  const rows = useMemo(() => buildFlatRows(txs), [txs]);

  const moduleSpans = useMemo(() =>
    computeSpans(rows, r => r.moduleNAME), [rows]);

  const subSpans = useMemo(() =>
    computeSpans(rows, (r, i) => `${r.moduleNAME}__${r.subModuleNAME}`), [rows]);

  const cell: React.CSSProperties = {
    padding: "9px 14px", fontSize: 13,
    borderBottom: `1px solID ${T.border}`, verticalAlign: "mIDdle",
  };

  return (
    <Box overflowX="auto">
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: T.navy }}>
            {["Module", "Sub Module", "Content", "Status", "Actions"].map((h, i) => (
              <th key={h} style={{
                padding: "11px 14px",
                textAlign: i >= 3 ? "center" : "left",
                color: "#E2E8F0", fontWeight: 600, fontSize: 11.5,
                letterSpacing: "0.06em", textTransform: "uppercase",
                borderBottom: `2px solID ${T.navyLight}`, whiteSpace: "nowrap",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              style={{ background: i % 2 === 0 ? T.bgCard : T.bg, transition: "background 0.1s" }}
            >
              {moduleSpans[i] !== null && (
                <td
                  rowSpan={moduleSpans[i]!}
                  style={{
                    ...cell,
                    background: T.accentLight,
                    borderRight: `2px solID ${T.accentMID}`,
                    borderBottom: `1px solID ${T.accentMID}`,
                    textAlign: "center", verticalAlign: "mIDdle", minWidth: 120,
                  }}
                >
                  <Box
                    display="inline-block" bg="#DBEAFE" color="#1E40AF"
                    px={3} py={1} borderRadius={6} fontSize="12px" fontWeight="bold"
                    maxW="150px" style={{ wordBreak: "break-word", textAlign: "center" }}
                  >
                    {row.moduleNAME}
                  </Box>
                </td>
              )}

              {subSpans[i] !== null && (
                <td
                  rowSpan={subSpans[i]!}
                  style={{
                    ...cell, background: "#F7FAFF",
                    borderRight: `1px solID ${T.border}`,
                    borderBottom: `1px solID ${T.border}`,
                    textAlign: "center", verticalAlign: "mIDdle", minWidth: 110,
                  }}
                >
                  {row.subModuleNAME === "—" ? (
                    <Text color={T.textMuted} fontSize="13px">—</Text>
                  ) : (
                    <Box
                      display="inline-block" bg="#F5F3FF" color="#6D28D9"
                      px={2} py="2px" borderRadius={5} fontSize="11.5px" fontWeight={500}
                      maxW="130px" style={{ wordBreak: "break-word", textAlign: "center" }}
                    >
                      📁 {row.subModuleNAME}
                    </Box>
                  )}
                </td>
              )}

              {/* Content */}
              <td style={{ ...cell, color: T.text, fontWeight: 400 }}>
                {row.contentNAME}
              </td>

              {/* Status */}
              <td style={{ ...cell, textAlign: "center" }}>
                <Box
                  display="inline-flex" alignItems="center" gap={1}
                  px={2.5} py="3px" borderRadius={20} fontSize="11px" fontWeight={700}
                  bg={row.active ? T.greenLight : T.redLight}
                  color={row.active ? "#065F46" : "#991B1B"}
                >
                  <Box
                    w="6px" h="6px" borderRadius="full" flexShrink={0}
                    bg={row.active ? T.green : T.red}
                  />
                  {row.active ? "Active" : "Inactive"}
                </Box>
              </td>

              {/* Actions */}
              <td style={{ ...cell, textAlign: "center" }}>
                <HStack gap={1.5} justify="center">
                  <button
                    onClick={() => row.sno && onToggle(row.sno)}
                    disabled={isToggling || !row.sno}
                    title={row.active ? "Deactivate" : "Activate"}
                    style={{
                      padding: "3px 10px", fontSize: 11.5, fontWeight: 600,
                      borderRadius: 6, cursor: "pointer", border: "1px solID",
                      borderColor: row.active ? "#F59E0B" : T.green,
                      color: row.active ? T.orange : T.green,
                      background: row.active ? "#FFFBEB" : "#F0FDF4",
                      transition: "all 0.12s",
                      opacity: isToggling || !row.sno ? 0.5 : 1,
                    }}
                  >
                    {row.active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => row.sno && onDelete(row.sno)}
                    disabled={isDeleting || !row.sno}
                    title="Delete"
                    style={{
                      padding: "4px 8px", borderRadius: 6, cursor: "pointer",
                      border: `1px solID ${T.redLight}`, background: T.redLight,
                      color: T.red, display: "flex", alignItems: "center",
                      transition: "all 0.12s",
                      opacity: isDeleting || !row.sno ? 0.5 : 1,
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </HStack>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
});
MergedViewTable.displayName = "MergedViewTable";

// ─── RoleCard ─────────────────────────────────────────────────────────────────

const RoleCard = memo(({ roleNAME, txs, onEdit, onToggle, onDelete, isToggling, isDeleting }: {
  roleNAME: string; txs: RoleTran[];
  onEdit: (roleNAME: string, txs: RoleTran[]) => void;
  onToggle: (sno: number) => void; onDelete: (sno: number) => void;
  isToggling: boolean; isDeleting: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);
  const activeCount = txs.filter(t => t.ACTIVE).length;

  return (
    <Box
      mb={4} border={`1px solID ${T.border}`} borderRadius={T.radiusLg}
      overflow="hIDden" boxShadow="0 1px 4px rgba(0,0,0,0.06)"
      transition="box-shadow 0.15s"
      _hover={{ boxShadow: "0 3px 12px rgba(0,0,0,0.1)" }}
    >
      {/* Header */}
      <Flex
        justify="space-between" align="center"
        px={4} py={3} bg={T.navyMID} cursor="pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <HStack gap={3}>
          <Box
            w="32px" h="32px" borderRadius={8} bg="rgba(255,255,255,0.12)"
            display="flex" alignItems="center" justifyContent="center"
          >
            <ShieldCheck size={15} color="white" />
          </Box>
          <Box>
            <Text fontWeight={700} color="white" fontSize="sm">{roleNAME}</Text>
            <HStack gap={2} mt={0.5}>
              <Box
                px={1.5} py="1px" borderRadius={10} fontSize="10px" fontWeight={600}
                bg="rgba(255,255,255,0.15)" color="white"
              >
                {txs.length} permission{txs.length !== 1 ? "s" : ""}
              </Box>
              <Box
                px={1.5} py="1px" borderRadius={10} fontSize="10px" fontWeight={600}
                bg={activeCount > 0 ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.2)"}
                color={activeCount > 0 ? "#6EE7B7" : "#FCA5A5"}
              >
                {activeCount} active
              </Box>
            </HStack>
          </Box>
        </HStack>
        <HStack gap={2} onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onEdit(roleNAME, txs)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600,
              background: "rgba(255,255,255,0.12)", color: "white",
              border: "1px solID rgba(255,255,255,0.2)",
              cursor: "pointer", transition: "background 0.12s",
            }}
          >
            <Edit2 size={12} /> Edit
          </button>
          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600,
              background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)",
              border: "1px solID rgba(255,255,255,0.12)",
              cursor: "pointer", transition: "background 0.12s",
            }}
          >
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            {expanded ? "HIDe" : "Show"}
          </button>
        </HStack>
      </Flex>

      {/* Table */}
      {expanded && (
        <MergedViewTable
          txs={txs} onToggle={onToggle} onDelete={onDelete}
          isToggling={isToggling} isDeleting={isDeleting}
        />
      )}
    </Box>
  );
});
RoleCard.displayName = "RoleCard";


// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RoleTranCreationPage() {


  const {theme} =useTheme();

  const [tabValue, setTabValue] = useState<string>("create");
  const [selectedRoleID,   setSelectedRoleID]   = useState<number | undefined>(undefined);
  const [selectedRoleNAME, setSelectedRoleNAME] = useState("");
  const [active,           setActive]           = useState(true);
  const [selectedContentIDs, setSelectedContentIDs] = useState<Set<number>>(new Set());
  const [expandedModuleIDs,  setExpandedModuleIDs]  = useState<Set<number> | undefined>(undefined);
  const [expandedSubIDs,     setExpandedSubIDs]     = useState<Set<number> | undefined>(undefined);
  const [rows,         setRows]         = useState<RoleTran[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingRole,  setEditingRole]  = useState<{ roleNAME: string; originalRows: RoleTran[] } | null>(null);

  const { data: menu = [] } = useMenu();
  const { data: roleTransactions, isLoading: isLoadingTransactions, refetch } = useRoleTransactions();
  const { mutate: insertRoles,      isPending: isInserting } = useInsertRoleTransaction();
  const { mutate: deleteTransaction, isPending: isDeleting } = useDeleteRoleTransaction();
  const { mutate: toggleTransaction, isPending: isToggling } = useToggleRoleTransactionActive();
  const { roles, loading: loadingRoles } = useRole();

  // ── Content meta lookup ────────────────────────────────────────────────────
  const contentMeta = useMemo(() => {
    const map = new Map<number, {
      moduleID: number; moduleNAME: string;
      subModuleID: number; subModuleNAME: string; contentNAME: string;
    }>();
    (menu as unknown as ModuleNode[] ).forEach(mod => {
      mod.CONTENTS?.forEach(c => {
        map.set(c.ID, { moduleID: mod.ID, moduleNAME: mod.NAME, subModuleID: 0, subModuleNAME: "", contentNAME: c.NAME });
      });
      mod.subModules?.forEach(sub => {
        sub.CONTENTS?.forEach(c => {
          map.set(c.ID, { moduleID: mod.ID, moduleNAME: mod.NAME, subModuleID: sub.ID, subModuleNAME: sub.NAME, contentNAME: c.NAME });
        });
      });
    });
    return map;
  }, [menu]);

  const computeExpandedIDs = useCallback((contentIDs: Set<number>) => {
    const modIDs = new Set<number>();
    const subIDs = new Set<number>();
    contentIDs.forEach(cID => {
      const m = contentMeta.get(cID);
      if (m) { modIDs.add(m.moduleID); if (m.subModuleID) subIDs.add(m.subModuleID); }
    });
    return { modIDs, subIDs };
  }, [contentMeta]);

  // ── Toggle helpers ─────────────────────────────────────────────────────────
  const handleToggleContent = useCallback((contentID: number) => {
    setSelectedContentIDs(prev => {
      const next = new Set(prev);
      next.has(contentID) ? next.delete(contentID) : next.add(contentID);
      return next;
    });
  }, []);

  const handleToggleGroup = useCallback((IDs: number[]) => {
    setSelectedContentIDs(prev => {
      const next = new Set(prev);
      const allSelected = IDs.every(ID => next.has(ID));
      if (allSelected) IDs.forEach(ID => next.delete(ID));
      else IDs.forEach(ID => next.add(ID));
      return next;
    });
  }, []);

  const isFormValID = selectedRoleID !== undefined && selectedContentIDs.size > 0;

  // ── Clear ──────────────────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    setSelectedRoleID(undefined); setSelectedRoleNAME("");
    setSelectedContentIDs(new Set()); setExpandedModuleIDs(undefined);
    setExpandedSubIDs(undefined); setRows([]);
    setEditingIndex(null); setEditingRole(null); setActive(true);
  }, []);

  // ── Add / edit rows ────────────────────────────────────────────────────────
  const handleAddRows = useCallback(() => {
    if (!isFormValID) { toastError("Please select a role and at least one content"); return; }

    const newRows: RoleTran[] = Array.from(selectedContentIDs).map(contentID => {
      const meta = contentMeta.get(contentID);
      if (!meta) throw new Error(`Content ${contentID} not found`);
      return {
        ROLEID: selectedRoleID!, ROLENAME: selectedRoleNAME,
        MODULEID: meta.moduleID, MODULENAME: meta.moduleNAME,
        SUBMODULEID: meta.subModuleID, SUBMODULENAME: meta.subModuleNAME,
        CONTENTID: contentID, CONTENTNAME: meta.contentNAME,
        ACTIVE: active,
      };
    });

    if (editingIndex !== null) {
      setRows(prev => { const u = [...prev]; u[editingIndex] = newRows[0]; return u; });
      setEditingIndex(null);
    } else {
      const existing = new Set(rows.map(r => `${r.ROLEID}-${r.CONTENTID}`));
      const unique = newRows.filter(r => !existing.has(`${r.ROLEID}-${r.CONTENTID}`));
      setRows(prev => [...prev, ...unique]);
    }
    setSelectedContentIDs(new Set());
  }, [isFormValID, selectedContentIDs, contentMeta, selectedRoleID, selectedRoleNAME, active, editingIndex, rows]);

  const handleEditRow = useCallback((index: number) => {
    const row = rows[index];
    const role = roles.find(r => r.ROLEID === row.ROLEID);
    if (role) { setSelectedRoleID(role.ROLEID); setSelectedRoleNAME(role.ROLENAME); }
    const IDs = new Set([row.CONTENTID]);
    setSelectedContentIDs(IDs);
    const { modIDs, subIDs } = computeExpandedIDs(IDs);
    setExpandedModuleIDs(modIDs); setExpandedSubIDs(subIDs);
    setActive(row.ACTIVE ?? true); setEditingIndex(index); setTabValue("create");
  }, [rows, roles, computeExpandedIDs]);

  const handleDeleteRow = useCallback((index: number) => {
    setRows(prev => prev.filter((_, i) => i !== index));
    if (editingIndex === index) { setEditingIndex(null); setSelectedContentIDs(new Set()); }
  }, [editingIndex]);

  const handleEditRole = useCallback((roleNAME: string, txs: RoleTran[]) => {
    const first = txs[0];
    setSelectedRoleID(first.ROLEID); setSelectedRoleNAME(first.ROLENAME);
    setRows(txs); setEditingRole({ roleNAME, originalRows: txs }); setEditingIndex(null);
    const IDs = new Set(txs.map(tx => tx.CONTENTID));
    setSelectedContentIDs(IDs);
    const { modIDs, subIDs } = computeExpandedIDs(IDs);
    setExpandedModuleIDs(modIDs); setExpandedSubIDs(subIDs);
    setActive(true); setTabValue("create");
  }, [computeExpandedIDs]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmitSuccess = useCallback(() => {
    toastCreated("Role permissions saved successfully");
    handleClear(); refetch();
  }, [handleClear, refetch]);

  const handleSubmit = useCallback(() => {
    if (!rows.length) { toastError("Please add at least one role transaction"); return; }

    if (editingRole) {
      const snos = editingRole.originalRows.filter(tx => tx.SNO).map(tx => tx.SNO!);
      if (!snos.length) { insertRoles(rows, { onSuccess: handleSubmitSuccess }); return; }
      let done = 0; let errored = false;
      snos.forEach(sno => deleteTransaction(sno, {
        onSuccess: () => { done++; if (done === snos.length && !errored) insertRoles(rows, { onSuccess: handleSubmitSuccess }); },
        onError:   () => { if (!errored) { errored = true; toastError("Error deleting old permissions"); } },
      }));
    } else {
      insertRoles(rows, { onSuccess: handleSubmitSuccess });
    }
  }, [rows, editingRole, insertRoles, deleteTransaction, handleSubmitSuccess]);

  const handleDeleteFromDB = useCallback((sno: number) => {
    if (window.confirm("Delete this permission?"))
      deleteTransaction(sno, { onSuccess: () => refetch() });
  }, [deleteTransaction, refetch]);

  const handleToggleFromDB = useCallback((sno: number) => {
    toggleTransaction(sno, { onSuccess: () => refetch() });
  }, [toggleTransaction, refetch]);

  // ── Staging table columns ──────────────────────────────────────────────────
  const selectedRowsColumns: TableColumn[] = useMemo(() => [
    { key: "MODULENAME",    label: "Module",     align: "start"  },
    { key: "SUBMODULENAME", label: "Sub Module", align: "start"  },
    { key: "CONTENTNAME",   label: "Content",    align: "start"  },
    { key: "ACTIVE",        label: "Active",     align: "center" },
    { key: "actions",       label: "",           align: "center" },
  ], []);

  const groupedByRole = useMemo(() => {
    if (!roleTransactions) return {} as Record<string, RoleTran[]>;
    const g: Record<string, RoleTran[]> = {};
    roleTransactions.forEach(tx => { (g[tx.ROLENAME] = g[tx.ROLENAME] || []).push(tx); });
    return g;
  }, [roleTransactions]);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <Box bg={T.bgCard} rounded={T.radiusLg} shadow="sm" border={`1px solID ${T.border}`} color={theme.colors.primary}>
      <Tabs.Root
        value={tabValue}
        onValueChange={(d: any) => setTabValue(d.value)}
        variant="enclosed"
      >
        <Tabs.List
          borderBottom={`2px solID ${T.border}`}
          bg={T.bg}
          borderRadius={`${T.radiusMd} ${T.radiusMd} 0 0`}
          p={1} gap={1}
        >
          {[
            { value: "create", label: "Create Role Transaction", icon: <ShieldCheck size={14} /> },
            { value: "view",   label: "View Role Transactions",  icon: <Eye         size={14} /> },
          ].map(tab => (
            <Tabs.Trigger
              key={tab.value} value={tab.value}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 16px", borderRadius: 8,
                fontSize: 13, fontWeight: 500,
                transition: "all 0.15s",
              }}
            >
              {tab.icon} {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* ── CREATE TAB ──────────────────────────────────────────────────── */}
        <Tabs.Content value="create">
          <Grid templateColumns={{ base: "1fr", md: "1fr 1.6fr" }} gap={5} p={4}>

            {/* LEFT: form + tree */}
            <GridItem>
              <Box
                bg={T.bg} p={4} rounded={T.radiusLg}
                border={`1px solID ${T.border}`}
                boxShadow="0 1px 3px rgba(0,0,0,0.05)"
              >
                {/* Section header */}
                <HStack gap={2} mb={4}>
                  <Box
                    w="28px" h="28px" borderRadius={7} bg={T.navyMID}
                    display="flex" alignItems="center" justifyContent="center"
                    flexShrink={0}
                  >
                    <ShieldCheck size={14} color="white" />
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight={700} color={T.text}>
                      {editingRole
                        ? `Editing: ${editingRole.roleNAME}`
                        : editingIndex !== null ? "Edit Transaction" : "New Transaction"}
                    </Text>
                    {editingRole && (
                      <Text fontSize="xs" color={T.orange}>⚠ Editing existing role permissions</Text>
                    )}
                  </Box>
                </HStack>

                <VStack gap={4} align="stretch">
                  {/* Role selector */}
                  <Box>
                    <Text fontSize="xs" fontWeight={700} color={T.textSub} mb={1.5}
                      textTransform="uppercase" letterSpacing="0.05em">
                      Role *
                    </Text>
                    {loadingRoles ? (
                      <Flex align="center" gap={2}><Spinner size="sm" /><Text fontSize="xs" color={T.textMuted}>Loading roles…</Text></Flex>
                    ) : (
                      <select
                        style={{
                          width: "100%", padding: "8px 12px", fontSize: 13,
                          borderRadius: T.radius, border: `1px solID ${T.borderMID}`,
                          background: T.bgCard, color: T.text,
                          outline: "none", cursor: "pointer",
                        }}
                        value={selectedRoleID ?? ""}
                        onChange={e => {
                          const ID = Number(e.target.value);
                          const r = roles.find(r => r.ROLEID === ID);
                          if (r) { setSelectedRoleID(r.ROLEID); setSelectedRoleNAME(r.ROLENAME); }
                          else   { setSelectedRoleID(undefined); setSelectedRoleNAME(""); }
                        }}
                      >
                        <option value="">Select role…</option>
                        {roles.map(r => <option key={r.ROLEID} value={r.ROLEID}>{r.ROLENAME}</option>)}
                      </select>
                    )}
                  </Box>

                  {/* Active toggle */}
                  <label style={{
                    display: "flex", alignItems: "center", gap: 8,
                    cursor: "pointer", userSelect: "none",
                    padding: "7px 10px", borderRadius: T.radius,
                    background: active ? T.greenLight : T.bg,
                    border: `1px solID ${active ? "#A7F3D0" : T.border}`,
                    transition: "all 0.15s", fontSize: 13, fontWeight: 500,
                    color: active ? "#065F46" : T.textMID,
                  }}>
                    <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)}
                      style={{ accentColor: T.green, width: 14, height: 14 }} />
                    Active Permission
                  </label>

                  <Box borderTop={`1px solID ${T.border}`} />

                  {/* Permission tree */}
                  <Box>
                    <HStack justify="space-between" mb={2}>
                      <Text fontSize="xs" fontWeight={700} color={T.textSub}
                        textTransform="uppercase" letterSpacing="0.05em">
                        Permissions
                      </Text>
                      {selectedContentIDs.size > 0 && (
                        <Box px={2} py="2px" borderRadius={10} fontSize="10px" fontWeight={700}
                          bg={T.accentLight} color={T.accent}>
                          {selectedContentIDs.size} selected
                        </Box>
                      )}
                    </HStack>
                    <Box
                      maxH="340px" overflowY="auto"
                      border={`1px solID ${T.border}`} rounded={T.radius} p={2} bg={T.bgCard}
                      css={{
                        "&::-webkit-scrollbar": { width: "4px" },
                        "&::-webkit-scrollbar-track": { background: "transparent" },
                        "&::-webkit-scrollbar-thumb": { background: T.borderMID, borderRadius: "4px" },
                      }}
                    >
                      {!menu.length ? (
                        <Flex justify="center" align="center" h="80px" gap={2}>
                          <Spinner size="sm" /><Text fontSize="xs" color={T.textMuted}>Loading permissions…</Text>
                        </Flex>
                      ) : (
                        <ModuleTree
                            menuData={menu as unknown as ModuleNode[]}
                          selectedContentIDs={selectedContentIDs}
                          onToggleContent={handleToggleContent}
                          onToggleGroup={handleToggleGroup}
                          expandedModuleIDs={expandedModuleIDs}
                          expandedSubIDs={expandedSubIDs}
                        />
                      )}
                    </Box>
                  </Box>

                  {/* Add row button */}
                  <button
                    onClick={handleAddRows} disabled={!isFormValID}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                      width: "100%", padding: "8px 16px", borderRadius: T.radius,
                      fontSize: 13, fontWeight: 600, cursor: isFormValID ? "pointer" : "not-allowed",
                      background: isFormValID ? T.navyMID : T.border,
                      color: isFormValID ? "white" : T.textMuted,
                      border: "none", transition: "all 0.15s",
                    }}
                  >
                    <Plus size={15} />
                    {editingIndex !== null ? "Update Row" : "Add Row(s)"}
                  </button>

                  {(editingIndex !== null || editingRole) && (
                    <button
                      onClick={handleClear}
                      style={{
                        width: "100%", padding: "7px 16px", borderRadius: T.radius,
                        fontSize: 13, fontWeight: 500, cursor: "pointer",
                        background: "transparent", color: T.textMID,
                        border: `1px solID ${T.border}`, transition: "all 0.15s",
                      }}
                    >
                      Cancel Edit
                    </button>
                  )}
                </VStack>
              </Box>
            </GridItem>

            {/* RIGHT: staging table */}
            <GridItem>
              <Box
                border={`1px solID ${T.border}`} rounded={T.radiusLg} p={3} bg={T.bgCard}
                h="100%" boxShadow="0 1px 3px rgba(0,0,0,0.05)"
              >
                <HStack justify="space-between" mb={3}>
                  <HStack gap={2}>
                    <Text fontSize="sm" fontWeight={700} color={T.text}>
                      Staged Transactions
                    </Text>
                    <Box px={2} py="2px" borderRadius={10} fontSize="11px" fontWeight={700}
                      bg={rows.length ? T.accentLight : T.bg}
                      color={rows.length ? T.accent : T.textMuted}>
                      {rows.length}
                    </Box>
                    {editingRole && (
                      <Box px={2} py="2px" borderRadius={10} fontSize="10px" fontWeight={700}
                        bg="#FFFBEB" color={T.orange}>
                        Editing Role
                      </Box>
                    )}
                  </HStack>
                  {rows.length > 0 && (
                    <button
                      onClick={handleClear}
                      style={{
                        fontSize: 11.5, color: T.textMuted, cursor: "pointer",
                        background: "none", border: "none", padding: "2px 6px",
                      }}
                    >
                      Clear all
                    </button>
                  )}
                </HStack>

                {rows.length === 0 ? (
                  <Flex
                    direction="column" justify="center" align="center"
                    h="200px" gap={3} color={T.textMuted}
                  >
                    <Box
                      w="44px" h="44px" borderRadius={12} bg={T.bg}
                      display="flex" alignItems="center" justifyContent="center"
                    >
                      <AlertCircle size={20} color={T.textMuted} />
                    </Box>
                    <Text fontSize="sm">No rows added yet</Text>
                    <Text fontSize="xs" color={T.textMuted} textAlign="center" maxW="200px">
                      Select a role and permissions, then click "Add Row(s)"
                    </Text>
                  </Flex>
                ) : (
                  <VStack align="stretch" gap={4}>
                    <Box overflowX="auto">
                      <CustomTable
                        columns={selectedRowsColumns}
                        data={rows} size="sm"
                        headerBg="blue.50" bodyBg="white" borderColor="gray.200"
                        renderRow={(row, IDx) => (
                          <>
                            <Table.Cell>{row.MODULENAME}</Table.Cell>
                            <Table.Cell>{row.SUBMODULENAME || "—"}</Table.Cell>
                            <Table.Cell>{row.CONTENTNAME}</Table.Cell>
                            <Table.Cell textAlign="center">
                              <Box
                                display="inline-block" px={2} py="1px" borderRadius={10}
                                fontSize="11px" fontWeight={600}
                                bg={row.ACTIVE ? T.greenLight : T.redLight}
                                color={row.ACTIVE ? "#065F46" : "#991B1B"}
                              >
                                {row.ACTIVE ? "Yes" : "No"}
                              </Box>
                            </Table.Cell>
                            <Table.Cell textAlign="center">
                              <HStack gap={1} justify="center">
                                <button
                                  onClick={() => handleEditRow(IDx)}
                                  style={{
                                    padding: "3px 8px", fontSize: 11.5, borderRadius: 5,
                                    background: T.accentLight, color: T.accent,
                                    border: `1px solID ${T.accentMID}`, cursor: "pointer", fontWeight: 600,
                                  }}
                                >Edit</button>
                                <button
                                  onClick={() => handleDeleteRow(IDx)}
                                  style={{
                                    padding: "4px 7px", borderRadius: 5,
                                    background: T.redLight, color: T.red,
                                    border: `1px solID #FECACA`, cursor: "pointer",
                                    display: "flex", alignItems: "center",
                                  }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </HStack>
                            </Table.Cell>
                          </>
                        )}
                      />
                    </Box>
                    <HStack justify="flex-end" gap={2} pt={1} borderTop={`1px solID ${T.border}`}>
                      <button
                        onClick={handleSubmit} disabled={isInserting}
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          padding: "7px 18px", borderRadius: T.radius,
                          fontSize: 13, fontWeight: 700,
                          background: isInserting ? T.border : T.green,
                          color: isInserting ? T.textMuted : "white",
                          border: "none", cursor: isInserting ? "not-allowed" : "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        <CheckSquare size={14} />
                        {isInserting ? "Submitting…" : "Submit All"}
                      </button>
                    </HStack>
                  </VStack>
                )}
              </Box>
            </GridItem>
          </Grid>
        </Tabs.Content>

        {/* ── VIEW TAB ────────────────────────────────────────────────────── */}
        <Tabs.Content value="view">
          <VStack align="stretch" gap={4} p={4}>
            {isLoadingTransactions ? (
              <Flex justify="center" align="center" minH="300px" gap={3}>
                <Spinner size="lg" color={T.accent} />
                <Text color={T.textMuted} fontSize="sm">Loading permissions…</Text>
              </Flex>
            ) : roleTransactions && roleTransactions.length > 0 ? (
              <>
                <HStack justify="space-between">
                  <HStack gap={2}>
                    <Text fontSize="sm" fontWeight={700} color={T.text}>Role Permissions</Text>
                    <Box px={2} py="2px" borderRadius={10} fontSize="11px" fontWeight={700}
                      bg={T.accentLight} color={T.accent}>
                      {Object.keys(groupedByRole).length} roles · {roleTransactions.length} total
                    </Box>
                  </HStack>
                </HStack>
                {Object.entries(groupedByRole).map(([roleNAME, txs]) => (
                  <RoleCard
                    key={roleNAME} roleNAME={roleNAME} txs={txs}
                    onEdit={handleEditRole}
                    onToggle={handleToggleFromDB} onDelete={handleDeleteFromDB}
                    isToggling={isToggling} isDeleting={isDeleting}
                  />
                ))}
              </>
            ) : (
              <Flex direction="column" justify="center" align="center" minH="300px" gap={3}>
                <Box
                  w="52px" h="52px" borderRadius={14} bg={T.bg}
                  display="flex" alignItems="center" justifyContent="center"
                >
                  <ShieldCheck size={24} color={T.textMuted} />
                </Box>
                <Text color={T.textMID} fontSize="sm" fontWeight={600}>No permissions found</Text>
                <Text color={T.textMuted} fontSize="xs">Create role transactions in the Create tab</Text>
              </Flex>
            )}
          </VStack>
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}