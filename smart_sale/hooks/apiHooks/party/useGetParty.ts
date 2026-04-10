"use client";

import { useQuery } from "@tanstack/react-query";
import { getAllPartyData } from "@/service/partyService";

export const useAllParties = () => {
    return useQuery({
        queryKey: ["parties"],
        queryFn: getAllPartyData,
    });
}