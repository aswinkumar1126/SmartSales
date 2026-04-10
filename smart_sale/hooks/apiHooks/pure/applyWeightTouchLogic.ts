export function applyWeightTouchLogic(row: any, key: string, value: any) {
    // Start from the current row
    const updated = { ...row, [key]: value };

    const mirrorMap: Record<string, string> = {
        WT: "AWT",
        TOUCH: "ATOUCH",
        PURE: "APURE",
    };

    // Track manually edited alternative fields
    const altFields = ["AWT", "ATOUCH", "APURE"];
    if (altFields.includes(key)) {
        updated[`__manual_${key}`] = true;
    }

    // Mirror main → alternative if not manually edited and alt is empty
    const altKey = mirrorMap[key];
    if (altKey && !row[`__manual_${altKey}`] && !row[altKey]) {
        updated[altKey] = value;
    }

    // Calculate main PURE if WT or TOUCH changes
    const wt = parseFloat(updated.WT);
    const touch = parseFloat(updated.TOUCH);
    if ((key === "WT" || key === "TOUCH") && !isNaN(wt) && !isNaN(touch)) {
        updated.PURE = ((wt * touch) / 100).toFixed(3);

        // Mirror PURE → APURE only if not manually edited and empty
        if (!row.__manual_APURE && !row.APURE) {
            updated.APURE = updated.PURE;
        }
    }

    // Calculate alternative PURE if AWT or ATOUCH changes
    const awt = parseFloat(updated.AWT);
    const atouch = parseFloat(updated.ATOUCH);
    if ((key === "AWT" || key === "ATOUCH") && !isNaN(awt) && !isNaN(atouch)) {
        updated.APURE = ((awt * atouch) / 100).toFixed(3);
    }

    return updated;
}
