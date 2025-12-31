// hooks/company/useCompany.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CompanyService, Company, CreateCompanyPayload, ApiResponse } from "@/service/CompanyService";
import { toastCreated, toastError, toastLoaded, toastUpdated, toastUploaded } from "@/component/toast/toast";
// Get all companies
export const useAllCompanies = () => {
    return useQuery<ApiResponse<Company[]>>({
        queryKey: ["companies"],
        queryFn: CompanyService.getAll,
      
    });
};

// Get company by ID
export const useCompanyById = (companyId: string) => {
    return useQuery<ApiResponse<Company>>({
        queryKey: ["company", companyId],
        queryFn: () => CompanyService.getById(companyId),
        enabled: !!companyId,
    });
    
};

// Create company
export const useCreateCompany = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ payload, logo }: { payload: CreateCompanyPayload; logo?: File }) =>
            CompanyService.create(payload, logo),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["companies"] });

        },
        onError: (error) => {
            toastError("Company", error.message);
        },

    });
};

// Update company
export const useUpdateCompany = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload, logo }: { id: string; payload: CreateCompanyPayload; logo?: File }) =>
            CompanyService.updateById(id, payload, logo),
        
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["companies"] });
            toastUpdated("Company");

        },
        onError: (error) => {
            toastError("Company", error.message);
        },
    });
};
