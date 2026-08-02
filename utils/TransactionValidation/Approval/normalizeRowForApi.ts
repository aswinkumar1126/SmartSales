import { ApprovalTransactionKey, APPROVALTRANSACTIONITEMS } from "@/types/transcation/ApprovalTransaction"; 
 
 export const normalizeRowForApi = (
     row: any,
     tranType: ApprovalTransactionKey,
     editTransaction?: boolean
 ): any => {

        console.log(row ,'row for saving')

        const {
            __rowId,
            __isNew,
            __previewSno,
            _stones,
            _miscCharges,
            ...rest
        } = row;


        // ---------------- APPROVAL_ISSUE ----------------
        if (tranType === "APPROVAL_ISSUE") {
            const itemId = rest.ITEMID ? Number(rest.ITEMID) : null;

            const tagged = rest.__isTaged || rest.ITEM_TYPE === "TAGGED";
            console.log(tagged, rest ,'taggedtaggedatsales');
       

            const payload: APPROVALTRANSACTIONITEMS = {
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
                // ...(tagged &&{ TAGNO : rest.TAGNO || null}),
                TAGNO: rest.TAGNO || null ,

                ...(editTransaction && { SNO: String(rest.SNO || "") }),
                ...(rest.DESCRIPTION && { DESCRIPTION: rest.DESCRIPTION }),

                ...(rest.SNO && { SNO: String(rest.SNO) }) // ✅ only added if exists


            };

            return payload;
        }

        // ---------------- SALES RETURN ----------------
        if (tranType === "APPROVAL_RECEIPT") {
            const payload: APPROVALTRANSACTIONITEMS = {
                
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
                ...(rest.DESCRIPTION && { DESCRIPTION: rest.DESCRIPTION }),
                
            };

            return payload;
        }

        return null;
    };
