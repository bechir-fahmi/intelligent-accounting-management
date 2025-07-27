import { ValueTransformer } from 'typeorm';

export class VectorTransformer implements ValueTransformer {
  to(value: number[]): string | null {
    if (!value || !Array.isArray(value)) {
      return null;
    }
    // Convert array to vector string format
    return `[${value.join(',')}]`;
  }

  from(value: string | number[]): number[] | null {
    if (!value) {
      return null;
    }
    
    // If it's already an array, return it
    if (Array.isArray(value)) {
      return value;
    }
    
    // If it's a string, parse it
    if (typeof value === 'string') {
      try {
        // Remove brackets and split by comma
        const cleanValue = value.replace(/^\[|\]$/g, '');
        return cleanValue.split(',').map(num => parseFloat(num.trim()));
      } catch (error) {
        console.error('Error parsing vector value:', error);
        return null;
      }
    }
    
    return null;
  }
}