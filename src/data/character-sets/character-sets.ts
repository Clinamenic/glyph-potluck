import { BASIC_LATIN_CHARACTERS, CharacterDefinition } from './basic-latin';

export interface CharacterSet {
  id: string;
  name: string;
  description: string;
  unicodeRange: { start: number; end: number };
  characters: CharacterDefinition[];
  priority: number; // Display order
  isDefault?: boolean;
  categories: string[];
}

export const CHARACTER_SETS: Record<string, CharacterSet> = {
  'basic-latin': {
    id: 'basic-latin',
    name: 'Basic Latin',
    description: 'Standard ASCII characters (A-Z, a-z, 0-9, punctuation) - Essential for English text',
    unicodeRange: { start: 0x0020, end: 0x007F },
    characters: BASIC_LATIN_CHARACTERS,
    priority: 1,
    isDefault: true,
    categories: ['uppercase', 'lowercase', 'digit', 'punctuation', 'symbol', 'space']
  },
  
  // Placeholder for extended sets (Phase 2)
  'extended-latin': {
    id: 'extended-latin',
    name: 'Extended Latin',
    description: 'Additional Latin characters with accents and diacritics',
    unicodeRange: { start: 0x0080, end: 0x024F },
    characters: [], // Will be populated in Phase 2
    priority: 2,
    categories: ['uppercase', 'lowercase', 'accented']
  }
};

// Helper functions
export const getCharacterSet = (id: string): CharacterSet | undefined => {
  return CHARACTER_SETS[id];
};

export const getDefaultCharacterSet = (): CharacterSet => {
  return CHARACTER_SETS['basic-latin'];
};

export const getAllCharacterSets = (): CharacterSet[] => {
  return Object.values(CHARACTER_SETS).sort((a, b) => a.priority - b.priority);
};

export const getAvailableCharacterSets = (): CharacterSet[] => {
  // Filter out sets with no characters (for now)
  return getAllCharacterSets().filter(set => set.characters.length > 0);
};

export const getCharacterSetById = (id: string): CharacterSet | undefined => {
  return CHARACTER_SETS[id];
};

// Character organization for UI
export const organizeCharactersForDisplay = (characterSet: CharacterSet) => {
  const organized = {
    uppercase: characterSet.characters.filter(c => c.category === 'uppercase'),
    lowercase: characterSet.characters.filter(c => c.category === 'lowercase'),
    digits: characterSet.characters.filter(c => c.category === 'digit'),
    punctuation: characterSet.characters.filter(c => c.category === 'punctuation'),
    symbols: characterSet.characters.filter(c => c.category === 'symbol'),
    space: characterSet.characters.filter(c => c.category === 'space')
  };

  return organized;
};

// Get character set statistics
export const getCharacterSetStats = (characterSet: CharacterSet) => {
  const organized = organizeCharactersForDisplay(characterSet);
  
  return {
    total: characterSet.characters.length,
    uppercase: organized.uppercase.length,
    lowercase: organized.lowercase.length,
    digits: organized.digits.length,
    punctuation: organized.punctuation.length,
    symbols: organized.symbols.length,
    space: organized.space.length
  };
};

// Validation helpers
export const validateCharacterSetCompletion = (
  characterSet: CharacterSet, 
  uploadedCharacters: Set<string>
): {
  completionPercentage: number;
  missingRequired: CharacterDefinition[];
  missingOptional: CharacterDefinition[];
  isMinimallyComplete: boolean;
} => {
  const required = ['A', 'a', '0', ' ']; // Minimal font requirements
  const missingRequired = characterSet.characters.filter(char => 
    required.includes(char.char) && !uploadedCharacters.has(char.unicode)
  );
  
  const missingOptional = characterSet.characters.filter(char => 
    !required.includes(char.char) && !uploadedCharacters.has(char.unicode)
  );
  
  const completionPercentage = (uploadedCharacters.size / characterSet.characters.length) * 100;
  const isMinimallyComplete = missingRequired.length === 0;
  
  return {
    completionPercentage,
    missingRequired,
    missingOptional,
    isMinimallyComplete
  };
};



