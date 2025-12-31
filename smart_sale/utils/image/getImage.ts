export const getImage = (imageUrl?: string | null): string | undefined => {
    if (!imageUrl) return undefined;

    const BASE_URL = "https://www.smartsaleson.com";

    // Ensure no double slashes
    return imageUrl.startsWith("http")
        ? imageUrl
        : `${BASE_URL}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
};
