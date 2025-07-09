import React, { useState, useEffect } from 'react';

interface SearchAndCreateSelectorProps<T extends { id: number; name: string }> {
  items: T[];
  selectedItemId: number | null;
  onSelectItemId: (itemId: number | null) => void;
  onCreateItem: (itemName: string) => void;
  placeholder: string;
  createButtonText: string;
}

const SearchAndCreateSelector = <T extends { id: number; name: string }>({ 
  items,
  selectedItemId,
  onSelectItemId,
  onCreateItem,
  placeholder,
  createButtonText,
}: SearchAndCreateSelectorProps<T>) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState<T[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredItems([]); // Show no items when search term is empty
    } else {
      setFilteredItems(
        items.filter((item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, items]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value, 10);
    onSelectItemId(id);
    setSearchTerm(''); // Clear search term after selection
  };

  const handleCreateClick = () => {
    if (searchTerm.trim() !== '') {
      onCreateItem(searchTerm.trim());
      setSearchTerm('');
      setIsCreating(false);
    }
  };

  return (
    <div className="search-create-selector">
      {!isCreating ? (
        <div className="search-select-container">
          <input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              onSelectItemId(null); // Deselect when typing
            }}
            className="form-input"
          />
          <select
            onChange={handleSelectChange}
            value={selectedItemId || ''}
            className="form-dropdown"
            size={Math.min(filteredItems.length + 1, 6)} // Show more options
          >
            <option value="" disabled>
              {filteredItems.length > 0 ? `Select an ${createButtonText.toLowerCase().replace('create new ', '')}` : `No matching ${createButtonText.toLowerCase().replace('create new ', '')}s`}
            </option>
            {filteredItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          {searchTerm.trim() !== '' && (
            <button onClick={() => setIsCreating(true)} className="action-button small-button">
              {createButtonText} "{searchTerm}"
            </button>
          )}
          {searchTerm.trim() !== '' && filteredItems.length > 0 && (
            <button onClick={() => setIsCreating(true)} className="action-button small-button">
              Create New {createButtonText.toLowerCase().replace('create new ', '')} Instead
            </button>
          )}
        </div>
      ) : (
        <div className="create-form">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            className="form-input"
            disabled // Disable while confirming creation
          />
          <button onClick={handleCreateClick} className="action-button small-button">
            Confirm {createButtonText} "{searchTerm}"
          </button>
          <button onClick={() => setIsCreating(false)} className="action-button small-button cancel-button">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchAndCreateSelector;