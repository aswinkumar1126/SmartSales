

import { useCallback } from "react";
import type { BarcodePrintDetail } from "@/store/barcode/useBarcodeStore";

/* ============================================================
   CONSTANTS
   ============================================================ */

const APP_NAME = "tag";

const PATHS = {
  SOURCE: `%USERPROFILE%\\Downloads\\barcode.txt`,
  DEST: `%USERPROFILE%\\Downloads\\CTR.txt`,
  BAT: `%USERPROFILE%\\Downloads\\${APP_NAME}.BAT`,
};

const PROTOCOL = {
  NAME: APP_NAME,
  REG_KEY: `HKEY_CLASSES_ROOT\\${APP_NAME}`,
};

const TSPL_HEADER = `SIZE 97.5 mm, 25 mm
DIRECTION 0,0
REFERENCE 0,0
OFFSET 0 mm
SET PEEL OFF
SET CUTTER OFF
SET PARTIAL_CUTTER OFF
SET TEAR ON
CLS`;

/* ============================================================
   HOOK
   ============================================================ */

export function usePrintHandler() {
  /* ─── Low-level helpers ─── */

  const buildProtocolUrl = useCallback(
    (action: string) => `${PROTOCOL.NAME}://${action}`,
    []
  );

  const downloadText = useCallback(
    (filename: string, content: string, onComplete?: () => void) => {
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (onComplete) setTimeout(onComplete, 500);
    },
    []
  );

  const triggerProtocol = useCallback(() => {
    // iframe approach to avoid navigating away
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = buildProtocolUrl("launch");
    document.body.appendChild(iframe);
    setTimeout(() => document.body.removeChild(iframe), 2000);
  }, [buildProtocolUrl]);

  /* ─── TSPL generation ─── */

  const buildLabelTSPL = useCallback((d: BarcodePrintDetail): string => `
QRCODE 766,166,L,3,A,180,M2,S7,"${d.TAGNO}"
CODEPAGE 1252
TEXT 691,161,"0",180,11,9,"size:${d.SIZE}"
TEXT 766,98,"0",180,10,7,"DONE_BY_SUGI"
TEXT 766,75,"0",180,7,6,"Mc:${d.MC}"
TEXT 766,56,"0",180,7,6,"GrsWt:${d.GRSWT}"
TEXT 762,35,"0",180,9,10,"Wt:${d.STNWT}"
TEXT 624,116,"0",90,8,6,"ASWIN"
PRINT 1,1`, []);

  const buildAllLabels = useCallback(
    (details: BarcodePrintDetail[]): string =>
      [TSPL_HEADER, ...details.map(buildLabelTSPL)].join("\n"),
    [buildLabelTSPL]
  );

  /* ─── Public API ─── */

  /** Print all labels in `details` */
  const printAll = useCallback(
    (details: BarcodePrintDetail[]) => {
      if (!details.length) return;
      const content = buildAllLabels(details);
      downloadText("barcode.txt", content, () => {
        setTimeout(triggerProtocol, 800);
      });
    },
    [buildAllLabels, downloadText, triggerProtocol]
  );

  /** Print a single label by matching TAGNO from the details array */
  const printSingle = useCallback(
    (tagNo: string, details: BarcodePrintDetail[]) => {
      const detail = details.find((d) => d.TAGNO === tagNo);
      if (!detail) return false;
      const content = buildAllLabels([detail]);
      downloadText("barcode.txt", content, () => {
        setTimeout(triggerProtocol, 500);
      });
      return true;
    },
    [buildAllLabels, downloadText, triggerProtocol]
  );

  /* ─── Setup file generation ─── */

  const buildBatFile = useCallback(
    (systemName: string, printerName: string): string => `@echo off
setlocal

set DOWNLOAD_PATH=${PATHS.SOURCE}
set DEST_PATH=${PATHS.DEST}

echo Waiting for barcode.txt...

set count=0
:waitloop
if exist "%DOWNLOAD_PATH%" goto movefile
timeout /t 1 >nul
set /a count+=1
if %count% GEQ 5 goto error
goto waitloop

:movefile
echo File found. Overwriting...
if exist "%DEST_PATH%" del "%DEST_PATH%"
move "%DOWNLOAD_PATH%" "%DEST_PATH%"

echo Printing...
TYPE "%DEST_PATH%" > \\\\${systemName}\\${printerName}

echo Done
exit

:error
echo File not found!
pause
exit`,
    []
  );

  const buildRegFile = useCallback(
    (): string => `Windows Registry Editor Version 5.00

[${PROTOCOL.REG_KEY}]
@="URL:${PROTOCOL.NAME} Protocol"
"URL Protocol"=""

[${PROTOCOL.REG_KEY}\\shell\\open\\command]
@="cmd.exe /c \\"%USERPROFILE%\\Downloads\\${APP_NAME}.BAT\\"`,
    []
  );

  /** Download the .bat and .reg setup files needed for the print protocol */
  const downloadSetupFiles = useCallback(
    (printerName: string, systemName: string) => {
      downloadText(`${APP_NAME}.BAT`, buildBatFile(systemName, printerName));
      downloadText(`${APP_NAME}.REG`, buildRegFile());
    },
    [buildBatFile, buildRegFile, downloadText]
  );

  return { printAll, printSingle, downloadSetupFiles };
}