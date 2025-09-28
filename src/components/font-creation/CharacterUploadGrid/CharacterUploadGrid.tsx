import React, { useState, useMemo } from 'react';
import { CharacterTile } from './CharacterTile';
import { CharacterSet, organizeCharactersForDisplay } from '../../../data/character-sets';
import { CharacterData } from '../../../services/storage/CharacterDataStorage';

interface CharacterUploadGridProps {
  characterSet: CharacterSet;
  characterDataMap: Map<string, CharacterData>;
  onFileUpload: (file: File, unicode: string) => void;
  onCharacterSelect: (unicode: string) => void;
  selectedCharacter?: string;
  showCategories?: boolean;
  searchFilter?: string;
}

type CategoryFilter = 'all' | 'uppercase' | 'lowercase' | 'digits' | 'punctuation' | 'symbols' | 'space';

export const CharacterUploadGrid: React.FC<CharacterUploadGridProps> = ({
  characterSet,
  characterDataMap,
  onFileUpload,
  onCharacterSelect,
  selectedCharacter,
  showCategories = true,
  searchFilter = ''
}) => {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  
  const organizedCharacters = useMemo(() => {
    return organizeCharactersForDisplay(characterSet);
  }, [characterSet]);

  const filteredCharacters = useMemo(() => {
    let characters = characterSet.characters;

    // Apply category filter
    if (categoryFilter !== 'all') {
      characters = characters.filter(char => {
        switch (categoryFilter) {
          case 'uppercase':
            return char.category === 'uppercase';
          case 'lowercase':
            return char.category === 'lowercase';
          case 'digits':
            return char.category === 'digit';
          case 'punctuation':
            return char.category === 'punctuation';
          case 'symbols':
            return char.category === 'symbol';
          case 'space':
            return char.category === 'space';
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (searchFilter) {
      const search = searchFilter.toLowerCase();
      characters = characters.filter(char => 
        char.char.toLowerCase().includes(search) ||
        char.name.toLowerCase().includes(search) ||
        char.unicode.toLowerCase().includes(search)
      );
    }

    return characters;
  }, [characterSet.characters, categoryFilter, searchFilter]);

  const getCategoryStats = () => {
    return {
      all: characterSet.characters.length,
      uppercase: organizedCharacters.uppercase.length,
      lowercase: organizedCharacters.lowercase.length,
      digits: organizedCharacters.digits.length,
      punctuation: organizedCharacters.punctuation.length,
      symbols: organizedCharacters.symbols.length,
      space: organizedCharacters.space.length
    };
  };

  const getUploadStats = () => {
    const uploaded = Array.from(characterDataMap.values()).filter(data => 
      data.status !== 'empty'
    ).length;
    const total = characterSet.characters.length;
    const percentage = total > 0 ? Math.round((uploaded / total) * 100) : 0;
    
    return { uploaded, total, percentage };
  };

  const stats = getCategoryStats();
  const uploadStats = getUploadStats();

  const CategoryButton: React.FC<{ 
    category: CategoryFilter; 
    label: string; 
    count: number;
  }> = ({ category, label, count }) => (
    <button
      onClick={() => setCategoryFilter(category)}
      className={`
        px-3 py-1 rounded-full text-sm font-medium transition-colors
        ${categoryFilter === category 
          ? 'bg-blue-500 text-white' 
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }
      `}
    >
      {label} ({count})
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {characterSet.name}
          </h3>
          <p className="text-sm text-gray-600">
            {uploadStats.uploaded} of {uploadStats.total} characters uploaded ({uploadStats.percentage}%)
          </p>
        </div>
        
        {/* Progress bar */}
        <div className="w-32 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadStats.percentage}%` }}
          />
        </div>
      </div>

      {/* Category filters */}
      {showCategories && (
        <div className="flex flex-wrap gap-2">
          <CategoryButton category="all" label="All" count={stats.all} />
          <CategoryButton category="uppercase" label="Uppercase" count={stats.uppercase} />
          <CategoryButton category="lowercase" label="Lowercase" count={stats.lowercase} />
          <CategoryButton category="digits" label="Digits" count={stats.digits} />
          <CategoryButton category="punctuation" label="Punctuation" count={stats.punctuation} />
          <CategoryButton category="symbols" label="Symbols" count={stats.symbols} />
          {stats.space > 0 && (
            <CategoryButton category="space" label="Space" count={stats.space} />
          )}
        </div>
      )}

      {/* Character grid */}
      <div className="character-grid">
        {filteredCharacters.map((character) => (
          <CharacterTile
            key={character.unicode}
            character={character}
            characterData={characterDataMap.get(character.unicode)}
            onFileUpload={onFileUpload}
            onSelect={onCharacterSelect}
            isSelected={selectedCharacter === character.unicode}
            size="medium"
          />
        ))}
      </div>

      {/* Empty state */}
      {filteredCharacters.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {searchFilter 
            ? `No characters found matching "${searchFilter}"`
            : 'No characters in this category'
          }
        </div>
      )}

      {/* Character count info */}
      <div className="text-sm text-gray-500 text-center">
        Showing {filteredCharacters.length} of {characterSet.characters.length} characters
      </div>
    </div>
  );
};
