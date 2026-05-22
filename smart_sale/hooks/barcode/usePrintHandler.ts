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

/* ============================================================
   EPL / XPML HEADER
   ============================================================ */

const EPL_HEADER = `<xpml><page quantity='0' pitch='15.0 mm'></xpml>I8,A
q711
O
JF
ZT
Q120,25
<xpml></page></xpml><xpml><page quantity='1' pitch='15.0 mm'></xpml>N`;

/* ============================================================
   HOOK
   ============================================================ */

export function usePrintHandler() {
  /* ─────────────────────────────────────────────
     LOW LEVEL HELPERS
     ───────────────────────────────────────────── */

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

      if (onComplete) {
        setTimeout(onComplete, 500);
      }
    },
    []
  );

  const triggerProtocol = useCallback(() => {
    const iframe = document.createElement("iframe");

    iframe.style.display = "none";
    iframe.src = buildProtocolUrl("launch");

    document.body.appendChild(iframe);

    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 2000);
  }, [buildProtocolUrl]);

  /* ─────────────────────────────────────────────
     LABEL GENERATION
     ───────────────────────────────────────────── */

  const buildLabelEPL = useCallback(
    (d: BarcodePrintDetail): string => `
A694,110,2,3,1,1,N," ${d.ITEMID || ""}-${d.TAGNO ?? ""} "
A694,85,2,3,1,1,N,"GWt:${d.GRSWT.toFixed(3) ?? ""}"
  ${d.SALESSTNWT > 0 ? `A694,60,2,3,1,1,N,"SWt:${d.SALESSTNWT.toFixed(3) ?? ""}"` : ""}
A694,35,2,3,1,1,N,"NWt:${d.NETWT?.toFixed(3) ?? ""}"

A488,110,2,2,1,1,N,"NG/NAVA BANGLE"
b424,15,Q,m2,s3,eL,"${d.TAGNO ?? ""}"


A520,60,3,3,1,1,N,"${d.SIZE ?? ""}"
${d.DIAWT > 0 ? `A410,83,2,2,1,1,N,"D:${d.DIAWT.toFixed(3)}"` : ""}
${d.NAVAWT > 0 ? `A410,60,2,2,1,1,N,"N:${d.NAVAWT.toFixed(3)}"` : ""}
${d.STNWT > 0 ? `A410,35,2,2,1,1,N,"S:${d.STNWT.toFixed(3)}"` : ""}
P1
<xpml></page></xpml>
`,
    []
  );

  const buildAllLabels = useCallback(
    (details: BarcodePrintDetail[]): string => {
      const labels = details.map(buildLabelEPL).join("\n");

      return `
${EPL_HEADER}
${labels}
<xpml><end/></xpml>
`;
    },
    [buildLabelEPL]
  );

  /* ─────────────────────────────────────────────
     PUBLIC API
     ───────────────────────────────────────────── */

  /** Print all labels */
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

  /** Print single label */
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

  /* ─────────────────────────────────────────────
     SETUP FILE GENERATION
     ───────────────────────────────────────────── */

  const buildBatFile = useCallback(
    (
      systemName: string,
      printerName: string
    ): string => `@echo off
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
  (systemName: string): string => `Windows Registry Editor Version 5.00

[${PROTOCOL.REG_KEY}]
@="URL:${PROTOCOL.NAME} Protocol"
"URL Protocol"=""

[${PROTOCOL.REG_KEY}\\shell\\open\\command]
@="\\"C:\\\\Users\\\\${systemName}\\\\Downloads\\\\${APP_NAME}.BAT\\" \\"%1\\""
`,
  []
);

  /** Download setup files */
  const downloadSetupFiles = useCallback(
    (printerName: string, systemName: string) => {
      downloadText(
        `${APP_NAME}.BAT`,
        buildBatFile(systemName, printerName)
      );

      downloadText(
        `${APP_NAME}.REG`,
        buildRegFile(systemName)
      );
    },
    [buildBatFile, buildRegFile, downloadText]
  );

  return {
    printAll,
    printSingle,
    downloadSetupFiles,
  };
}