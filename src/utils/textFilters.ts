/**
 * Latin alfabesi olmayan karakterleri filtrele
 * Japonca, Çince, Rusça, Arapça, Hintçe vb. dilleri filtreler
 */
export const isLatinAlphabet = (text: string): boolean => {
  if (!text) return false;

  // Latin harfleri, sayılar, noktalama işaretleri ve yaygın karakterler
  // Türkçe karakterler de dahil (ç, ğ, ı, ö, ş, ü)
  const latinRegex = /^[\p{Script=Latin}\p{Script=Common}\s\d\p{P}]+$/u;

  // Metni test et
  const result = latinRegex.test(text);
  
  if (!result) {
    console.log('❌ [TextFilter] Non-Latin text detected:', text);
  }
  
  return result;
};

/**
 * Film/dizi listesini Latin alfabesine göre filtrele
 */
export const filterLatinMovies = <T extends { title?: string; name?: string }>(items: T[]): T[] => {
  if (!items || items.length === 0) return [];

  const filtered = items.filter((item) => {
    const title = item?.title ?? item?.name ?? '';
    return isLatinAlphabet(title);
  });

  const removedCount = items.length - filtered.length;
  if (removedCount > 0) {
    console.log(`🔤 [TextFilter] Removed ${removedCount} non-Latin items from ${items.length} total`);
  }

  return filtered;
};
