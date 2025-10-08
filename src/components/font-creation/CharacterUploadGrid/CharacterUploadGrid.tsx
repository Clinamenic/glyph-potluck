import React, { useState, useMemo } from 'react';
import { CharacterTile } from './CharacterTile';
import { CharacterSet } from '../../../data/character-sets';
import { CharacterData } from '../../../services/storage/CharacterDataStorage';

interface CharacterUploadGridProps {
  characterSet: CharacterSet;
  characterDataMap: Map<string, CharacterData>;
  onFileUpload: (file: File, unicode: string) => void;
  onCharacterSelect: (unicode: string) => void;
  selectedCharacter?: string;
  showCategories?: boolean;
  searchFilter?: string;
  categoryFilter?: CategoryFilter;
  onCategoryFilterChange?: (filter: CategoryFilter) => void;
}

export type CategoryFilter = 'all' | 'uppercase' | 'lowercase' | 'digits' | 'punctuation' | 'symbols' | 'space';

interface CharacterGridFiltersProps {
  characterSet: CharacterSet;
  characterDataMap: Map<string, CharacterData>;
  categoryFilter: CategoryFilter;
  onCategoryFilterChange: (filter: CategoryFilter) => void;
}

export const CharacterGridFilters: React.FC<CharacterGridFiltersProps> = ({
  characterSet,
  characterDataMap: _characterDataMap,
  categoryFilter,
  onCategoryFilterChange
}) => {
  const getCategoryStats = useMemo(() => {
    const stats = {
      all: characterSet.characters.length,
      uppercase: 0,
      lowercase: 0,
      digits: 0,
      punctuation: 0,
      symbols: 0,
      space: 0
    };

    characterSet.characters.forEach(char => {
      switch (char.category) {
        case 'uppercase':
          stats.uppercase++;
          break;
        case 'lowercase':
          stats.lowercase++;
          break;
        case 'digit':
          stats.digits++;
          break;
        case 'punctuation':
          stats.punctuation++;
          break;
        case 'symbol':
          stats.symbols++;
          break;
        case 'space':
          stats.space++;
          break;
      }
    });

    return stats;
  }, [characterSet.characters]);

  const CategoryButton: React.FC<{
    category: CategoryFilter;
    label: string;
    count: number;
  }> = ({ category, label, count }) => (
    <button
      onClick={() => onCategoryFilterChange(category)}
      className={`category-button ${categoryFilter === category
        ? 'category-button--active'
        : 'category-button--inactive'
        }`}
    >
      {label} ({count})
    </button>
  );


  return (
    <div className="character-grid-filters">
      <CategoryButton category="all" label="All" count={getCategoryStats.all} />
      <CategoryButton category="uppercase" label="Uppercase" count={getCategoryStats.uppercase} />
      <CategoryButton category="lowercase" label="Lowercase" count={getCategoryStats.lowercase} />
      <CategoryButton category="digits" label="Digits" count={getCategoryStats.digits} />
      <CategoryButton category="punctuation" label="Punctuation" count={getCategoryStats.punctuation} />
      <CategoryButton category="symbols" label="Symbols" count={getCategoryStats.symbols} />
      {getCategoryStats.space > 0 && (
        <CategoryButton category="space" label="Space" count={getCategoryStats.space} />
      )}
    </div>
  );
};

export const CharacterUploadGrid: React.FC<CharacterUploadGridProps> = ({
  characterSet,
  characterDataMap,
  onFileUpload,
  onCharacterSelect,
  selectedCharacter,
  showCategories: _showCategories = true,
  searchFilter = '',
  categoryFilter: externalCategoryFilter,
  onCategoryFilterChange: _onCategoryFilterChange
}) => {
  const [_internalCategoryFilter, _setInternalCategoryFilter] = useState<CategoryFilter>('all');

  // Use external filter if provided, otherwise use internal state
  const categoryFilter = externalCategoryFilter !== undefined ? externalCategoryFilter : _internalCategoryFilter;

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

  return (
    <div className="character-grid-container">
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
        <div className="character-grid-empty">
          {searchFilter
            ? `No characters found matching "${searchFilter}"`
            : 'No characters in this category'
          }
        </div>
      )}

      {/* Character count info */}
      <div className="character-grid-count">
        Showing {filteredCharacters.length} of {characterSet.characters.length} characters
      </div>
    </div>
  );
};
