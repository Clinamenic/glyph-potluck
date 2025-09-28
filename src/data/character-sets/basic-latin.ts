export interface CharacterDefinition {
  unicode: string;
  char: string;
  name: string;
  category: 'uppercase' | 'lowercase' | 'digit' | 'punctuation' | 'symbol' | 'space';
  description?: string;
}

export const BASIC_LATIN_CHARACTERS: CharacterDefinition[] = [
  // Space
  { unicode: 'U+0020', char: ' ', name: 'SPACE', category: 'space' },
  
  // Punctuation and symbols
  { unicode: 'U+0021', char: '!', name: 'EXCLAMATION MARK', category: 'punctuation' },
  { unicode: 'U+0022', char: '"', name: 'QUOTATION MARK', category: 'punctuation' },
  { unicode: 'U+0023', char: '#', name: 'NUMBER SIGN', category: 'symbol' },
  { unicode: 'U+0024', char: '$', name: 'DOLLAR SIGN', category: 'symbol' },
  { unicode: 'U+0025', char: '%', name: 'PERCENT SIGN', category: 'symbol' },
  { unicode: 'U+0026', char: '&', name: 'AMPERSAND', category: 'symbol' },
  { unicode: 'U+0027', char: "'", name: 'APOSTROPHE', category: 'punctuation' },
  { unicode: 'U+0028', char: '(', name: 'LEFT PARENTHESIS', category: 'punctuation' },
  { unicode: 'U+0029', char: ')', name: 'RIGHT PARENTHESIS', category: 'punctuation' },
  { unicode: 'U+002A', char: '*', name: 'ASTERISK', category: 'symbol' },
  { unicode: 'U+002B', char: '+', name: 'PLUS SIGN', category: 'symbol' },
  { unicode: 'U+002C', char: ',', name: 'COMMA', category: 'punctuation' },
  { unicode: 'U+002D', char: '-', name: 'HYPHEN-MINUS', category: 'punctuation' },
  { unicode: 'U+002E', char: '.', name: 'FULL STOP', category: 'punctuation' },
  { unicode: 'U+002F', char: '/', name: 'SOLIDUS', category: 'punctuation' },
  
  // Digits
  { unicode: 'U+0030', char: '0', name: 'DIGIT ZERO', category: 'digit' },
  { unicode: 'U+0031', char: '1', name: 'DIGIT ONE', category: 'digit' },
  { unicode: 'U+0032', char: '2', name: 'DIGIT TWO', category: 'digit' },
  { unicode: 'U+0033', char: '3', name: 'DIGIT THREE', category: 'digit' },
  { unicode: 'U+0034', char: '4', name: 'DIGIT FOUR', category: 'digit' },
  { unicode: 'U+0035', char: '5', name: 'DIGIT FIVE', category: 'digit' },
  { unicode: 'U+0036', char: '6', name: 'DIGIT SIX', category: 'digit' },
  { unicode: 'U+0037', char: '7', name: 'DIGIT SEVEN', category: 'digit' },
  { unicode: 'U+0038', char: '8', name: 'DIGIT EIGHT', category: 'digit' },
  { unicode: 'U+0039', char: '9', name: 'DIGIT NINE', category: 'digit' },
  
  // More punctuation
  { unicode: 'U+003A', char: ':', name: 'COLON', category: 'punctuation' },
  { unicode: 'U+003B', char: ';', name: 'SEMICOLON', category: 'punctuation' },
  { unicode: 'U+003C', char: '<', name: 'LESS-THAN SIGN', category: 'symbol' },
  { unicode: 'U+003D', char: '=', name: 'EQUALS SIGN', category: 'symbol' },
  { unicode: 'U+003E', char: '>', name: 'GREATER-THAN SIGN', category: 'symbol' },
  { unicode: 'U+003F', char: '?', name: 'QUESTION MARK', category: 'punctuation' },
  { unicode: 'U+0040', char: '@', name: 'COMMERCIAL AT', category: 'symbol' },
  
  // Uppercase letters
  { unicode: 'U+0041', char: 'A', name: 'LATIN CAPITAL LETTER A', category: 'uppercase' },
  { unicode: 'U+0042', char: 'B', name: 'LATIN CAPITAL LETTER B', category: 'uppercase' },
  { unicode: 'U+0043', char: 'C', name: 'LATIN CAPITAL LETTER C', category: 'uppercase' },
  { unicode: 'U+0044', char: 'D', name: 'LATIN CAPITAL LETTER D', category: 'uppercase' },
  { unicode: 'U+0045', char: 'E', name: 'LATIN CAPITAL LETTER E', category: 'uppercase' },
  { unicode: 'U+0046', char: 'F', name: 'LATIN CAPITAL LETTER F', category: 'uppercase' },
  { unicode: 'U+0047', char: 'G', name: 'LATIN CAPITAL LETTER G', category: 'uppercase' },
  { unicode: 'U+0048', char: 'H', name: 'LATIN CAPITAL LETTER H', category: 'uppercase' },
  { unicode: 'U+0049', char: 'I', name: 'LATIN CAPITAL LETTER I', category: 'uppercase' },
  { unicode: 'U+004A', char: 'J', name: 'LATIN CAPITAL LETTER J', category: 'uppercase' },
  { unicode: 'U+004B', char: 'K', name: 'LATIN CAPITAL LETTER K', category: 'uppercase' },
  { unicode: 'U+004C', char: 'L', name: 'LATIN CAPITAL LETTER L', category: 'uppercase' },
  { unicode: 'U+004D', char: 'M', name: 'LATIN CAPITAL LETTER M', category: 'uppercase' },
  { unicode: 'U+004E', char: 'N', name: 'LATIN CAPITAL LETTER N', category: 'uppercase' },
  { unicode: 'U+004F', char: 'O', name: 'LATIN CAPITAL LETTER O', category: 'uppercase' },
  { unicode: 'U+0050', char: 'P', name: 'LATIN CAPITAL LETTER P', category: 'uppercase' },
  { unicode: 'U+0051', char: 'Q', name: 'LATIN CAPITAL LETTER Q', category: 'uppercase' },
  { unicode: 'U+0052', char: 'R', name: 'LATIN CAPITAL LETTER R', category: 'uppercase' },
  { unicode: 'U+0053', char: 'S', name: 'LATIN CAPITAL LETTER S', category: 'uppercase' },
  { unicode: 'U+0054', char: 'T', name: 'LATIN CAPITAL LETTER T', category: 'uppercase' },
  { unicode: 'U+0055', char: 'U', name: 'LATIN CAPITAL LETTER U', category: 'uppercase' },
  { unicode: 'U+0056', char: 'V', name: 'LATIN CAPITAL LETTER V', category: 'uppercase' },
  { unicode: 'U+0057', char: 'W', name: 'LATIN CAPITAL LETTER W', category: 'uppercase' },
  { unicode: 'U+0058', char: 'X', name: 'LATIN CAPITAL LETTER X', category: 'uppercase' },
  { unicode: 'U+0059', char: 'Y', name: 'LATIN CAPITAL LETTER Y', category: 'uppercase' },
  { unicode: 'U+005A', char: 'Z', name: 'LATIN CAPITAL LETTER Z', category: 'uppercase' },
  
  // More symbols
  { unicode: 'U+005B', char: '[', name: 'LEFT SQUARE BRACKET', category: 'punctuation' },
  { unicode: 'U+005C', char: '\\', name: 'REVERSE SOLIDUS', category: 'punctuation' },
  { unicode: 'U+005D', char: ']', name: 'RIGHT SQUARE BRACKET', category: 'punctuation' },
  { unicode: 'U+005E', char: '^', name: 'CIRCUMFLEX ACCENT', category: 'symbol' },
  { unicode: 'U+005F', char: '_', name: 'LOW LINE', category: 'punctuation' },
  { unicode: 'U+0060', char: '`', name: 'GRAVE ACCENT', category: 'symbol' },
  
  // Lowercase letters
  { unicode: 'U+0061', char: 'a', name: 'LATIN SMALL LETTER A', category: 'lowercase' },
  { unicode: 'U+0062', char: 'b', name: 'LATIN SMALL LETTER B', category: 'lowercase' },
  { unicode: 'U+0063', char: 'c', name: 'LATIN SMALL LETTER C', category: 'lowercase' },
  { unicode: 'U+0064', char: 'd', name: 'LATIN SMALL LETTER D', category: 'lowercase' },
  { unicode: 'U+0065', char: 'e', name: 'LATIN SMALL LETTER E', category: 'lowercase' },
  { unicode: 'U+0066', char: 'f', name: 'LATIN SMALL LETTER F', category: 'lowercase' },
  { unicode: 'U+0067', char: 'g', name: 'LATIN SMALL LETTER G', category: 'lowercase' },
  { unicode: 'U+0068', char: 'h', name: 'LATIN SMALL LETTER H', category: 'lowercase' },
  { unicode: 'U+0069', char: 'i', name: 'LATIN SMALL LETTER I', category: 'lowercase' },
  { unicode: 'U+006A', char: 'j', name: 'LATIN SMALL LETTER J', category: 'lowercase' },
  { unicode: 'U+006B', char: 'k', name: 'LATIN SMALL LETTER K', category: 'lowercase' },
  { unicode: 'U+006C', char: 'l', name: 'LATIN SMALL LETTER L', category: 'lowercase' },
  { unicode: 'U+006D', char: 'm', name: 'LATIN SMALL LETTER M', category: 'lowercase' },
  { unicode: 'U+006E', char: 'n', name: 'LATIN SMALL LETTER N', category: 'lowercase' },
  { unicode: 'U+006F', char: 'o', name: 'LATIN SMALL LETTER O', category: 'lowercase' },
  { unicode: 'U+0070', char: 'p', name: 'LATIN SMALL LETTER P', category: 'lowercase' },
  { unicode: 'U+0071', char: 'q', name: 'LATIN SMALL LETTER Q', category: 'lowercase' },
  { unicode: 'U+0072', char: 'r', name: 'LATIN SMALL LETTER R', category: 'lowercase' },
  { unicode: 'U+0073', char: 's', name: 'LATIN SMALL LETTER S', category: 'lowercase' },
  { unicode: 'U+0074', char: 't', name: 'LATIN SMALL LETTER T', category: 'lowercase' },
  { unicode: 'U+0075', char: 'u', name: 'LATIN SMALL LETTER U', category: 'lowercase' },
  { unicode: 'U+0076', char: 'v', name: 'LATIN SMALL LETTER V', category: 'lowercase' },
  { unicode: 'U+0077', char: 'w', name: 'LATIN SMALL LETTER W', category: 'lowercase' },
  { unicode: 'U+0078', char: 'x', name: 'LATIN SMALL LETTER X', category: 'lowercase' },
  { unicode: 'U+0079', char: 'y', name: 'LATIN SMALL LETTER Y', category: 'lowercase' },
  { unicode: 'U+007A', char: 'z', name: 'LATIN SMALL LETTER Z', category: 'lowercase' },
  
  // Final symbols
  { unicode: 'U+007B', char: '{', name: 'LEFT CURLY BRACKET', category: 'punctuation' },
  { unicode: 'U+007C', char: '|', name: 'VERTICAL LINE', category: 'symbol' },
  { unicode: 'U+007D', char: '}', name: 'RIGHT CURLY BRACKET', category: 'punctuation' },
  { unicode: 'U+007E', char: '~', name: 'TILDE', category: 'symbol' },
];

// Helper functions for organizing characters
export const getCharactersByCategory = (category: CharacterDefinition['category']): CharacterDefinition[] => {
  return BASIC_LATIN_CHARACTERS.filter(char => char.category === category);
};

export const getRequiredCharacters = (): CharacterDefinition[] => {
  // Essential characters for basic font functionality
  return BASIC_LATIN_CHARACTERS.filter(char => 
    ['A', 'a', '0', ' ', '.'].includes(char.char)
  );
};

export const getAlphabetCharacters = (): CharacterDefinition[] => {
  return [
    ...getCharactersByCategory('uppercase'),
    ...getCharactersByCategory('lowercase')
  ];
};

export const getCharacterByUnicode = (unicode: string): CharacterDefinition | undefined => {
  return BASIC_LATIN_CHARACTERS.find(char => char.unicode === unicode);
};

export const getCharacterByChar = (char: string): CharacterDefinition | undefined => {
  return BASIC_LATIN_CHARACTERS.find(c => c.char === char);
};



