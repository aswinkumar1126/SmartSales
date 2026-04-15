
import { TransactionKey, PurchasePayload } from "@/types/transcation/Transaction"; 

 export const normalizeRowForApi = (
     row: any,
     tranType: TransactionKey,
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

        console.log(rest ,'rowscolumns');
     

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

             ...(rest.SNO && { SNO: String(rest.SNO) }) // ✅ only added if exists
         };
     }

        // ---------------- PURCHASE ----------------
        if (tranType === "purchase") {
            const itemId = rest.ITEMID ? Number(rest.ITEMID) : null;

            const tagged = rest.__isTaged ;

            const payload: PurchasePayload = {
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
               


                ...(editTransaction && { SNO: String(rest.SNO || "") }),
                ...(rest.DESCRIPTION && { DESCRIPTION: rest.DESCRIPTION }),
                ...(rest.SNO && { SNO: String(rest.SNO) }) // ✅ only added if exists
            };

            return payload;
        }

        // ---------------- PURCHASE RETURN ----------------
        if (tranType === "purchase_return") {
            const payload: PurchasePayload = {
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

                // ✅ Flexible return logic
                ...(rest.TAGNO && { TAGNO: rest.TAGNO }),
                ...(rest.BILLNO && { BILLNO: rest.BILLNO }),

                ...(editTransaction && { SNO: String(rest.SNO || "") }),
                ...(rest.DESCRIPTION && { DESCRIPTION: rest.DESCRIPTION }),
                ...(rest.SNO && { SNO: String(rest.SNO) }) // ✅ only added if exists
            };

            return payload;
        }

        return null;
    };
