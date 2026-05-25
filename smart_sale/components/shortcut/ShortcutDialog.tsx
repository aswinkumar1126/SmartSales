import React, { useState, useMemo } from "react";
import {
  Box,
  Text,
  Dialog,
  Portal,
  CloseButton,
  Input,
} from "@chakra-ui/react";
import { Keyboard, Search } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { useTheme } from "@/context/theme/themeContext";

//Key Management
import { useGlobalKey } from "@/components/key/useGlobalKey";

// ─── Types ───────────────────────────────────────────────────────────────────

type Shortcut = {
  keys: string;
  label: string;
  category?: string;
};


type Props = {
  remoteOpen?: boolean;
  shortcuts?: Shortcut[];
};

// ─── Kbd Badge ────────────────────────────────────────────────────────────────

const KbdBadge = ({
  keyStr,
  theme,
}: {
  keyStr: string;
  theme: any;
}) => (
  <Box
    as="kbd"
    display="inline-flex"
    alignItems="center"
    justifyContent="center"
    fontSize="10px"
    fontFamily={theme.fonts.body2}
    fontWeight="600"
    letterSpacing="0.02em"
    px="7px"
    py="3px"
    minW="24px"
    bg={theme.colors.accent}
    border="1px solid"
    borderColor={theme.colors.accent}
    borderBottomWidth="2px"
    borderRadius="5px"
    lineHeight="1.5"
    color={"black"}
    boxShadow={`0 1px 0 0 rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)`}
    userSelect="none"
    whiteSpace="nowrap"
  >
    {keyStr}
  </Box>
);

// ─── Shortcut Row ─────────────────────────────────────────────────────────────

const ShortcutRow = ({
  shortcut,
  theme,
}: {
  shortcut: Shortcut;
  theme: any;
}) => {
  const parts = shortcut.keys.split("+").map((k) => k.trim());

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      px={3}
      py="9px"
      borderRadius="7px"
      transition="background 0.12s ease"
      _hover={{ bg: theme.colors.surfaceHover ?? "gray.50" }}
      gap={4}
    >
      {/* Label */}
      <Text
        fontSize="12.5px"
        fontFamily={theme.fonts.body2}
        color={theme.colors.textPrimary ?? "gray.700"}
        fontWeight="450"
        lineHeight="1.4"
        flex={1}
        minW={0}
      >
        {shortcut.label}
      </Text>

      {/* Keys */}
      <Box display="flex" alignItems="center" gap="3px" flexShrink={0}>
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            <KbdBadge keyStr={part} theme={theme} />
            {i < parts.length - 1 && (
              <Text
                fontSize="9px"
                color={theme.colors.textSecondary ?? "gray.400"}
                fontFamily={theme.fonts.body2}
                fontWeight="500"
                mx="1px"
              >
                +
              </Text>
            )}
          </React.Fragment>
        ))}
      </Box>
    </Box>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ShortcutDialog = ({ remoteOpen = false, shortcuts = [
  { keys: "ALT+S", label: "Create" },
  { keys: "ALT+U", label: "Update" },
  { keys: "ALT+R", label: "Reset Form" },
  { keys: "ALT+E", label: "Exit Form" },
] }: Props) => {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useGlobalKey("F2", () =>{  setOpen((o) => !o) } );

  // Group shortcuts by category
  const grouped = useMemo(() => {
    const filtered = shortcuts.filter(
      (s) =>
        !query ||
        s.label.toLowerCase().includes(query.toLowerCase()) ||
        s.keys.toLowerCase().includes(query.toLowerCase())
    );

    const map = new Map<string, Shortcut[]>();
    for (const s of filtered) {
      const cat = s.category ?? "General";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(s);
    }
    return map;
  }, [shortcuts, query]);

  const totalVisible = [...grouped.values()].reduce(
    (acc, arr) => acc + arr.length,
    0
  );


  return (
    <>
      {/* Trigger button */}
      <Box position="fixed" bottom={5} right={5} zIndex={50}>
        <Tooltip content="Keyboard shortcuts" showArrow>
          <Box
            as="button"
            display="flex"
            alignItems="center"
            justifyContent="center"
            w="34px"
            h="34px"
            borderRadius="8px"
            border="1px solid"
            borderColor={theme.colors.greyColor}
            bg={theme.colors.whiteColor ?? "white"}
            cursor="pointer"
            transition="all 0.15s ease"
            _hover={{
              bg: theme.colors.whiteColor ?? "gray.50",
              borderColor: theme.colors.accient,
              transform: "scale(1.04)",
            }}
            _active={{ transform: "scale(0.97)" }}
            boxShadow="0 1px 3px rgba(0,0,0,0.08)"
            onClick={() => {
              setOpen(true);
              setQuery("");
            }}
            aria-label="Open keyboard shortcuts"
          >
            <Keyboard color={theme.colors.accient} size={16} />
          </Box>
        </Tooltip>
      </Box>

      {/* Dialog */}
      <Dialog.Root
        open={open || remoteOpen}
        onOpenChange={(e) => setOpen(e.open)}
        motionPreset="slide-in-bottom"
      >
        <Portal>
          <Dialog.Backdrop
            bg="blackAlpha.400"
            backdropFilter="blur(4px)"
          />

          <Dialog.Positioner>
            <Dialog.Content
              maxW="480px"
              w="calc(100vw - 32px)"
              borderRadius="14px"
              border="1px solid"
              borderColor={ theme.colors.greyColor}
              boxShadow="0 20px 60px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.08)"
              overflow="hidden"
              bg={"white"}
            >
              {/* Header */}
              <Dialog.Header
                px={4}
                pt={4}
                pb={3}
                borderBottom="1px solid"
                borderColor={theme.colors.greyColor}
                display="flex"
                alignItems="center"
                gap={2}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  w="28px"
                  h="28px"
                  borderRadius="7px"
                  bg={`${theme.colors.accient}15`}
                  flexShrink={0}
                >
                  <Keyboard color={theme.colors.accient} size={14} />
                </Box>

                <Box flex={1} minW={0}>
                  <Dialog.Title
                    fontSize="13px"
                    fontWeight="600"
                    fontFamily={theme.fonts.body2}
                    color={theme.colors.primaryText ?? "gray.800"}
                    lineHeight="1.3"
                  >
                    Keyboard Shortcuts
                  </Dialog.Title>
                  <Text
                    fontSize="11px"
                    fontFamily={theme.fonts.body2}
                    color={theme.colors.primaryText ?? "gray.500"}
                    mt="1px"
                  >
                    {shortcuts.length} shortcuts available
                  </Text>
                </Box>

                <Dialog.CloseTrigger asChild>
                  <CloseButton
                    size="sm"
                    color={"gray.500"}
                    _hover={{ bg: "gray.100", color: "gray.700" }}
                    borderRadius="6px"
                  />
                </Dialog.CloseTrigger>
              </Dialog.Header>

              {/* Search */}
              {shortcuts.length > 6 && (
                <Box
                  px={4}
                  py={2.5}
                  borderBottom="1px solid"
                  borderColor={theme.colors.greyColor}
                >
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={2}
                    px={2.5}
                    py={1.5}
                    borderRadius="8px"
                    border="1px solid"
                    borderColor={theme.colors.greyColor}
                    bg={"gray.50"}
                    _focusWithin={{
                      borderColor: theme.colors.accient,
                      boxShadow: `0 0 0 2px ${theme.colors.accient}20`,
                      bg: "white",
                    }}
                    transition="all 0.15s ease"
                  >
                    <Search
                      size={13}
                      color={"#9CA3AF"}
                    />
                    <Input
                      placeholder="Search shortcuts…"
                      fontSize="12px"
                      fontFamily={theme.fonts.body2}
                      border="none"
                      outline="none"
                      boxShadow="none"
                      bg="transparent"
                      px={0}
                      py={0}
                      h="auto"
                      _placeholder={{
                        color: "gray.400",
                      }}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </Box>
                </Box>
              )}

              {/* Shortcut list */}
              <Dialog.Body
                px={2}
                py={2}
                maxH="360px"
                overflowY="auto"
                css={{
                  "&::-webkit-scrollbar": { width: "4px" },
                  "&::-webkit-scrollbar-track": { background: "transparent" },
                  "&::-webkit-scrollbar-thumb": {
                    background: theme.colors.greyColor,
                    borderRadius: "4px",
                  },
                }}
              >
                {totalVisible === 0 ? (
                  <Box
                    py={8}
                    textAlign="center"
                    color={ "gray.400"}
                  >
                    <Text fontSize="12px" fontFamily={theme.fonts.body2}>
                      No shortcuts match "{query}"
                    </Text>
                  </Box>
                ) : (
                  [...grouped.entries()].map(([category, items], catIdx) => (
                    <Box key={category} mb={catIdx < grouped.size - 1 ? 1 : 0}>
                      {/* Category heading (only if more than one group) */}
                      {grouped.size > 1 && (
                        <Text
                          fontSize="10px"
                          fontWeight="600"
                          fontFamily={theme.fonts.body2}
                          color={ "gray.400"}
                          textTransform="uppercase"
                          letterSpacing="0.06em"
                          px={3}
                          pt={catIdx === 0 ? 1 : 2}
                          pb={1}
                        >
                          {category}
                        </Text>
                      )}

                      {/* Rows */}
                      {items.map((shortcut) => (
                        <ShortcutRow
                          key={`${shortcut.keys}-${shortcut.label}`}
                          shortcut={shortcut}
                          theme={theme}
                        />
                      ))}

                      {/* Divider between categories */}
                      {catIdx < grouped.size - 1 && (
                        <Box
                          mx={3}
                          mt={1}
                          borderBottom="1px solid"
                          borderColor={
                            theme.colors.greyColor
                          }
                          opacity={0.6}
                        />
                      )}
                    </Box>
                  ))
                )}
              </Dialog.Body>

              {/* Footer hint */}
              <Box
                px={4}
                py={2.5}
                borderTop="1px solid"
                borderColor={theme.colors.greyColor}
                display="flex"
                alignItems="center"
                gap={1.5}
              >
                <KbdBadge keyStr="F2" theme={theme} />
                <Text
                  fontSize="11px"
                  fontFamily={theme.fonts.body2}
                  color={"gray.400"}
                >
                  to open shortcuts anywhere
                </Text>
              </Box>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
};

export default ShortcutDialog;