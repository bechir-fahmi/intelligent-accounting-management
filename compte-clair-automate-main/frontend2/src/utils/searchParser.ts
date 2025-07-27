import { SemanticFieldSearchParams } from '@/services/documents.service';

export interface ParsedSearch {
  clientName?: string;
  year?: string;
  searchType: 'clientName' | 'year' | 'both' | 'unknown';
}

export function parseSearchQuery(query: string): ParsedSearch {
  if (!query.trim()) {
    return { searchType: 'unknown' };
  }

  const trimmedQuery = query.trim();
  
  // Year pattern to match (4 digits between 1900-2099)
  const yearPattern = /\b(19\d{2}|20\d{2})\b/g;

  let foundYear: string | undefined;
  let remainingText = trimmedQuery;

  // Extract year from the query
  const yearMatches = trimmedQuery.match(yearPattern);
  if (yearMatches && yearMatches.length > 0) {
    foundYear = yearMatches[0];
    // Remove the year from the remaining text
    remainingText = trimmedQuery.replace(yearPattern, '').trim();
  }

  // Clean up remaining text (remove extra spaces)
  remainingText = remainingText.replace(/\s+/g, ' ').trim();

  // Determine search type and return appropriate params
  if (foundYear && remainingText) {
    // Both client name and year found
    return {
      clientName: remainingText,
      year: foundYear,
      searchType: 'both'
    };
  } else if (foundYear && !remainingText) {
    // Only year found
    return {
      year: foundYear,
      searchType: 'year'
    };
  } else if (!foundYear && remainingText) {
    // Only client name found (or assumed to be client name)
    return {
      clientName: remainingText,
      searchType: 'clientName'
    };
  } else {
    return { searchType: 'unknown' };
  }
}

// No need for date normalization since we're only using years

export function createSemanticSearchParams(parsedSearch: ParsedSearch): SemanticFieldSearchParams {
  const params: SemanticFieldSearchParams = {};
  
  if (parsedSearch.clientName) {
    params.clientName = parsedSearch.clientName;
  }
  
  if (parsedSearch.year) {
    params.date = parsedSearch.year; // Backend expects 'date' parameter but we send year
  }
  
  return params;
}

export function getSearchDescription(parsedSearch: ParsedSearch): string {
  switch (parsedSearch.searchType) {
    case 'clientName':
      return `Recherche par nom de client: "${parsedSearch.clientName}"`;
    case 'year':
      return `Recherche par année: ${parsedSearch.year}`;
    case 'both':
      return `Recherche par client "${parsedSearch.clientName}" et année ${parsedSearch.year}`;
    default:
      return 'Recherche non reconnue';
  }
}