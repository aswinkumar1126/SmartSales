import { SaleTransactionKey, SALESTRANSACTIONITEMS } from "@/types/transcation/SaleTransaction"; 
 
 export const normalizeRowForApi = (
     row: any,
     tranType: SaleTransactionKey,
     editTransaction?: boolean
 ): any => {

        const {
            __rowId,
            __isNew,
            __previewSno,
            _stones,
            _miscCharges,
            ...rest
        } = row;

     

        // ---------------- ISSUE / RECEIPT ----------------
        if (tranType === "issue" || tranType === "receipt") {
            return {
                PUREID: rest.PUREID ? Number(rest.PUREID) : undefined,
                WT: Number(rest.WT || 0),
                TOUCH: Number(rest.TOUCH || 0),
                PUREWT: Number(rest.PUREWT || 0),
                AWT: Number(rest.AWT || 0),
                ATOUCH: Number(rest.ATOUCH || 0),
                APUREWT: Number(rest.APUREWT || 0),
            };
        }

        // ---------------- SALES ----------------
        if (tranType === "sales") {
            const itemId = rest.ITEMID ? Number(rest.ITEMID) : null;

            const tagged = rest.__isTaged ;

            const payload: SALESTRANSACTIONITEMS = {
                ITEMID: itemId,
                PCS: Number(rest.PCS || 0),
                GRSWT: Number(rest.GRSWT || 0),
                STNWT: Number(rest.STNWT || 0),
                NETWT: Number(rest.NETWT || 0),
                WASTYPE: String(rest.WASTYPE || "TOUCH"),
                TOUCH: Number(rest.TOUCH || 0),
                PUREWT: Number(rest.PUREWT || 0),
                HMC: Number(rest.HMC || 0),
                STNAMT: Number(rest.STNAMT || 0),
                MC: Number(rest.MC || 0),
               

                // ✅ Only include TAGNO if tagged item
                ...(tagged && { TAGNO: rest.TAGNO || "" }),

                ...(editTransaction && { SNO: String(rest.SNO || "") }),
                ...(rest.DESCRIPTION && { DESCRIPTION: rest.DESCRIPTION }),
            };

            return payload;
        }

        // ---------------- SALES RETURN ----------------
        if (tranType === "sales_return") {
            const payload: SALESTRANSACTIONITEMS = {
                ITEMID: rest.ITEMID ? Number(rest.ITEMID) : null,
                PCS: Number(rest.PCS || 0),
                GRSWT: Number(rest.GRSWT || 0),
                STNWT: Number(rest.STNWT || 0),
                NETWT: Number(rest.NETWT || 0),
                WASTYPE: String(rest.WASTYPE || "TOUCH"),
                TOUCH: Number(rest.TOUCH || 0),
                PUREWT: Number(rest.PUREWT || 0),
                HMC: Number(rest.HMC || 0),
                STNAMT: Number(rest.STNAMT || 0),
                MC: Number(rest.MC || 0),
                REFSNO: String(rest.SNO),

                // ✅ Flexible return logic
                ...(rest.TAGNO && { TAGNO: rest.TAGNO }),
                ...(rest.BILLNO && { BILLNO: rest.BILLNO }),

                ...(editTransaction && { SNO: String(rest.SNO || "") }),
                ...(rest.DESCRIPTION && { DESCRIPTION: rest.DESCRIPTION }),
            };

            return payload;
        }

        return null;
    };
