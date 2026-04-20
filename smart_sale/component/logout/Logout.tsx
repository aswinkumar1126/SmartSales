'use client';

import { Box } from '@chakra-ui/react';
import {
  Button,
  CloseButton,
  Dialog,
  Portal,
} from '@chakra-ui/react';
import { useAuth } from '@/hooks/apiHooks/auth/useAuth';
import { useTheme } from '@/context/theme/themeContext';

interface LogoutProps {
  isOpen: boolean;
  onClose: () => void;
}

const Logout: React.FC<LogoutProps> = ({
  isOpen = false,
  onClose,
}) => {
  const { logout } = useAuth();
  const { theme } = useTheme();

  const handleLogout = (): void => {
    logout();
  };

  return (
    <Box>
      <Dialog.Root open={isOpen} onOpenChange={onClose}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header padding={2}>
                Confirm Logout
              </Dialog.Header>
              
              <Dialog.Body>
                Are you sure you want to log out of your account?
              </Dialog.Body>
              
              <Dialog.Footer padding={2} gap={2}>
                <Button
                  variant="outline"
                  onClick={onClose}
                  size="xs"
                >
                  Cancel
                </Button>
                
                <Button
                  onClick={handleLogout}
                  size="xs"
                  backgroundColor={theme.colors.red}
                  _hover={{ opacity: 0.8 }}
                >
                  Log Out
                </Button>
              </Dialog.Footer>
              
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Box>
  );
};

export default Logout;