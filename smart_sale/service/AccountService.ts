import { axiosInstance } from "@/api/axiosInstance";
import { AccountForm } from "@/types/account/Account";


export const createAccountById = async (payload: AccountForm) => {

    try {
        const response = await axiosInstance.put(`/account`, payload);
        return response.data;
    }
    catch (err) {
        console.log(err);
        return err;
    }

} 
export const getAllAccounts = async() =>{

    try{
        const response = await axiosInstance.get('/account');
        return response.data;
    }
    catch(err){
        console.log(err);
        return err;
    }

}

export const getAccountById = async (id:number) => {

    try {
        const response = await axiosInstance.get(`/account/${id}`);
        return response.data;
    }
    catch (err) {
        console.log(err);
        return err;
    }

}
export const updateAccountById = async (id: number , payload:AccountForm) => {

    try {
        const response = await axiosInstance.put(`/account/${id}`,payload);
        return response.data;
    }
    catch (err) {
        console.log(err);
        return err;
    }

}
export const deleteAccountById = async (id: number) => {

    try {
        const response = await axiosInstance.delete(`/account/${id}`);
        return response.data;
    }
    catch (err) {
        console.log(err);
        return err;
    }

}
