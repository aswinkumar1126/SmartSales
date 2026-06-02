// ================= HOOKS =================
// hooks/useRoleTran.ts

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createModule,
  getModules,
  getMenu,
  updateModule,
  deleteModule,

  createSubModule,
  getSubModules,
  updateSubModule,
  deleteSubModule,

  createContent,
  getContents,
  updateContent,
  deleteContent,

  getRoleTransactions,
  insertRoleTransaction,
  saveRoleTransaction,
  getRoleTransactionsByRoleId,
  getActiveRoleTransactions,
  getActiveRoleTransactionsByRoleId,
  deleteRoleTransaction,
  toggleRoleTransactionActive,
} from "@/service/RoleTranService";

import {
  toastCreated,
  toastError,
} from "@/component/toast/toast";

// =====================================================
// MODULE
// =====================================================

// GET MODULES
export const useModules = () => {
  return useQuery({
    queryKey: ["modules"],
    queryFn: getModules,
  });
};

// GET MENU
export const useMenu = () => {
  return useQuery({
    queryKey: ["menu"],
    queryFn: getMenu,
  });
};

// CREATE MODULE
export const useCreateModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createModule,

    onSuccess: () => {
    
      queryClient.invalidateQueries({
        queryKey: ["modules"],
      });
      // toastCreated("Module");
    },

    onError: () => {
      toastError("Failed To Create Module");
    },
  });
};

// UPDATE MODULE
export const useUpdateModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateModule,

    onSuccess: () => {
      toastCreated("Module Updated Successfully");

      queryClient.invalidateQueries({
        queryKey: ["modules"],
      });
    },

    onError: () => {
      toastError("Failed To Update Module");
    },
  });
};

// DELETE MODULE
export const useDeleteModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteModule,

    onSuccess: () => {
      toastCreated("Module Deleted Successfully");

      queryClient.invalidateQueries({
        queryKey: ["modules"],
      });
    },

    onError: () => {
      toastError("Failed To Delete Module");
    },
  });
};

// =====================================================
// SUB MODULE
// =====================================================

// GET SUB MODULES
export const useSubModules = (
  moduleId: number
) => {
  return useQuery({
    queryKey: ["submodules", moduleId],
    queryFn: () => getSubModules(moduleId),
    enabled: !!moduleId,
  });
};

// CREATE SUB MODULE
export const useCreateSubModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      moduleId,
      body,
    }: {
      moduleId: number;
      body: {
        NAME: string;
        DISPLAYORDER: number;
      };
    }) => createSubModule(moduleId, body),

    onSuccess: () => {
      toastCreated("Sub Module Created Successfully");

      queryClient.invalidateQueries({
        queryKey: ["submodules"],
      });
    },

    onError: () => {
      toastError("Failed To Create Sub Module");
    },
  });
};

// UPDATE SUB MODULE
export const useUpdateSubModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSubModule,

    onSuccess: () => {
      toastCreated("Sub Module Updated Successfully");

      queryClient.invalidateQueries({
        queryKey: ["submodules"],
      });
    },

    onError: () => {
      toastError("Failed To Update Sub Module");
    },
  });
};

// DELETE SUB MODULE
export const useDeleteSubModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSubModule,

    onSuccess: () => {
      toastCreated("Sub Module Deleted Successfully");

      queryClient.invalidateQueries({
        queryKey: ["submodules"],
      });
    },

    onError: () => {
      toastError("Failed To Delete Sub Module");
    },
  });
};

// =====================================================
// CONTENT
// =====================================================

// GET CONTENTS
export const useContents = (
  id: number,
  isHeader :boolean
) => {
  console.log(id, isHeader, 'isHeader :boolean' )
  return useQuery({
    queryKey: ["contents", id , isHeader],
    queryFn: () => getContents({id, ISHEADER:isHeader}),

  });
};


// CREATE CONTENT
export const useCreateContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      body,
    }: {
    
      body: {
        NAME: string;
        DISPLAYORDER: number;
        NAVHEADER : number;
        NAVSUBHEADER?:number
      };
    }) => createContent(body),

    onSuccess: () => {
      toastCreated("Content Created Successfully");

      queryClient.invalidateQueries({
        queryKey: ["contents"],
      });
    },

    onError: () => {
      toastError("Failed To Create Content");
    },
  });
};


// UPDATE CONTENT
export const useUpdateContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateContent,

    onSuccess: () => {
      toastCreated("Content Updated Successfully");

      queryClient.invalidateQueries({
        queryKey: ["contents"],
      });
    },

    onError: () => {
      toastError("Failed To Update Content");
    },
  });
};

// DELETE CONTENT
export const useDeleteContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteContent,

    onSuccess: () => {
      toastCreated("Content Deleted Successfully");

      queryClient.invalidateQueries({
        queryKey: ["contents"],
      });
    },

    onError: () => {
      toastError("Failed To Delete Content");
    },
  });
};

// =====================================================
// ROLE TRANSACTION
// =====================================================

// GET ROLE TRANSACTIONS
export const useRoleTransactions = () => {
  return useQuery({
    queryKey: ["roleTransactions"],
    queryFn: getRoleTransactions,
  });
};

// SAVE SINGLE ROLE TRANSACTION
export const useSaveRoleTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveRoleTransaction,

    onSuccess: () => {
      toastCreated("Role Transaction Saved Successfully");

      queryClient.invalidateQueries({
        queryKey: ["roleTransactions"],
      });
    },

    onError: () => {
      toastError("Failed To Save Role Transaction");
    },
  });
};

// INSERT ROLE TRANSACTION (BULK)
export const useInsertRoleTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: insertRoleTransaction,

    onSuccess: () => {
      toastCreated("Role Transactions Inserted Successfully");

      queryClient.invalidateQueries({
        queryKey: ["roleTransactions"],
      });
    },

    onError: () => {
      toastError("Failed To Insert Role Transactions");
    },
  });
};

// GET ROLE TRANSACTIONS BY ROLE ID
export const useRoleTransactionsByRoleId = (roleId: number) => {
  return useQuery({
    queryKey: ["roleTransactions", "roleId", roleId],
    queryFn: () => getRoleTransactionsByRoleId(roleId),
    enabled: !!roleId,
  });
};

// GET ACTIVE ROLE TRANSACTIONS
export const useActiveRoleTransactions = () => {
  return useQuery({
    queryKey: ["roleTransactions", "active"],
    queryFn: getActiveRoleTransactions,
  });
};

// GET ACTIVE ROLE TRANSACTIONS BY ROLE ID
export const useActiveRoleTransactionsByRoleId = (roleId: number) => {
  return useQuery({
    queryKey: ["roleTransactions", "active", "roleId", roleId],
    queryFn: () => getActiveRoleTransactionsByRoleId(roleId),
    enabled: !!roleId,
  });
};

// DELETE ROLE TRANSACTION
export const useDeleteRoleTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRoleTransaction,

    onSuccess: () => {
      toastCreated("Role Transaction Deleted Successfully");

      queryClient.invalidateQueries({
        queryKey: ["roleTransactions"],
      });
    },

    onError: () => {
      toastError("Failed To Delete Role Transaction");
    },
  });
};

// TOGGLE ROLE TRANSACTION ACTIVE STATUS
export const useToggleRoleTransactionActive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleRoleTransactionActive,

    onSuccess: () => {
      toastCreated("Role Transaction Status Updated Successfully");

      queryClient.invalidateQueries({
        queryKey: ["roleTransactions"],
      });
    },

    onError: () => {
      toastError("Failed To Update Role Transaction Status");
    },
  });
};