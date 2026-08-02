export const normalizePath = (path?: string) =>
    path?.replace(/\/$/, "") || "";