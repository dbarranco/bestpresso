// eslint-disable-next-line react/only-export-components -- nav helpers co-located intentionally
import { useMemo, useState } from 'react'
import { SETTINGS_TREE, searchSettings, settingsSubcategory } from '../../domain/settingsTree'
import type { SettingsCategory, SettingsSubcategory } from '../../domain/settingsTree'

interface SettingsNavProps {
  selectedCategoryId: string
  selectedSubcategoryId: string
  onSelect: (categoryId: string, subcategoryId: string) => void
}

export function SettingsNav({ selectedCategoryId, selectedSubcategoryId, onSelect }: SettingsNavProps) {
  const [query, setQuery] = useState('')
  const results = useMemo(() => searchSettings(query), [query])

  const selectMatch = (categoryId: string, subcategoryId: string) => {
    setQuery('')
    onSelect(categoryId, subcategoryId)
  }

  const selectSubcategory = (category: SettingsCategory, subcategory: SettingsSubcategory) => {
    onSelect(category.id, subcategory.id)
  }

  if (results.length > 0) {
    return (
      <nav className="settings-nav" aria-label="Settings search results">
        <div className="settings-nav__search">
          <input
            className="settings-nav__search-input"
            type="search"
            placeholder="Search settings"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoFocus
          />
        </div>
        <div className="settings-nav__results">
          {results.map((match) => (
            <div key={`${match.categoryId}-${match.subcategory.id}`} className="settings-nav__result-group">
              <p className="settings-nav__result-category">{match.categoryName}</p>
              <button
                className={`settings-nav__item${match.subcategory.id === selectedSubcategoryId ? ' settings-nav__item--active' : ''}`}
                type="button"
                onClick={() => selectMatch(match.categoryId, match.subcategory.id)}
              >
                <span className="settings-nav__item-label">{match.subcategory.name}</span>
              </button>
            </div>
          ))}
        </div>
      </nav>
    )
  }

  const selectedCategory = SETTINGS_TREE.find((category) => category.id === selectedCategoryId)

  return (
    <nav className="settings-nav" aria-label="Settings">
      <div className="settings-nav__search">
        <input
          className="settings-nav__search-input"
          type="search"
          placeholder="Search settings"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="settings-nav__rail">
        <div className="settings-nav__categories" role="tablist" aria-label="Categories">
          {SETTINGS_TREE.map((category) => (
            <button
              key={category.id}
              className={`settings-nav__category${category.id === selectedCategoryId ? ' settings-nav__category--active' : ''}`}
              type="button"
              role="tab"
              aria-selected={category.id === selectedCategoryId}
              onClick={() => selectSubcategory(category, category.subcategories[0])}
            >
              <span className="settings-nav__item-label">{category.name}</span>
              <span className="settings-nav__chevron" aria-hidden="true">›</span>
            </button>
          ))}
        </div>
        {selectedCategory && (
          <div className="settings-nav__subcategories" role="tablist" aria-label="Settings">
            {selectedCategory.subcategories.map((subcategory) => (
              <button
                key={subcategory.id}
                className={`settings-nav__item${subcategory.id === selectedSubcategoryId ? ' settings-nav__item--active' : ''}`}
                type="button"
                role="tab"
                aria-selected={subcategory.id === selectedSubcategoryId}
                onClick={() => selectSubcategory(selectedCategory, subcategory)}
              >
                <span className="settings-nav__item-label">{subcategory.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}

export function resolveDefaultSelection() {
  const category = SETTINGS_TREE[0]
  return { categoryId: category.id, subcategoryId: category.subcategories[0].id }
}

export function resolveSubcategory(subcategoryId: string) {
  return settingsSubcategory(subcategoryId)
}