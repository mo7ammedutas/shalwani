/** Parse the JSON image list stored on a product row (shared by server and client). */
export function productImagesClient(imagesJson: string): string[] {
  try {
    const parsed = JSON.parse(imagesJson) as string[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [];
  } catch {
    return [];
  }
}
