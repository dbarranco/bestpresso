import assert from 'node:assert/strict'
import test from 'node:test'
import { SETTINGS_TREE, searchSettings, settingsCategory, settingsPageForSubcategory, settingsSubcategory } from '../src/domain/settingsTree.ts'

test('mirrors the Streamline category list in order', () => {
  assert.deepEqual(
    SETTINGS_TREE.map((category) => category.name),
    ['Quick Adjustments', 'Bluetooth', 'Calibration', 'Machine', 'Skin', 'Miscellaneous', 'Updates', 'User Manual'],
  )
})

test('every category exposes at least one subcategory', () => {
  for (const category of SETTINGS_TREE) {
    assert.ok(category.subcategories.length > 0, `${category.name} should have subcategories`)
  }
})

test('subcategory ids are unique across the whole tree', () => {
  const ids = SETTINGS_TREE.flatMap((category) => category.subcategories.map((subcategory) => subcategory.id))
  assert.equal(new Set(ids).size, ids.length)
})

test('looks up a category by id', () => {
  const bluetooth = settingsCategory('bluetooth')
  assert.equal(bluetooth?.name, 'Bluetooth')
  assert.deepEqual(bluetooth?.subcategories.map((subcategory) => subcategory.id), ['machine', 'scale'])
})

test('looks up a subcategory by its own id', () => {
  const flush = settingsSubcategory('flush')
  assert.equal(flush?.name, 'Flush')
  assert.equal(flush?.page, 'flush')
})

test('returns undefined for an unknown category id', () => {
  assert.equal(settingsCategory('nope'), undefined)
})

test('maps a subcategory id to its registered page key', () => {
  assert.equal(settingsPageForSubcategory('hot-water'), 'hotWater')
  assert.equal(settingsPageForSubcategory('fan-threshold'), 'machineFan')
  assert.equal(settingsPageForSubcategory('cup-warmer'), 'cupWarmer')
  assert.equal(settingsPageForSubcategory('scale-calibration'), 'scaleCalibration')
  assert.equal(settingsPageForSubcategory('steam-purge-mode'), 'steamPurge')
  assert.equal(settingsPageForSubcategory('select-skin'), 'skin')
  assert.equal(settingsPageForSubcategory('brewing'), undefined)
})

test('every subcategory maps to a registered page', () => {
  const pages = SETTINGS_TREE.flatMap((category) => category.subcategories.map((subcategory) => subcategory.page))
  assert.ok(pages.every((page) => page !== undefined))
})

test('returns no matches for an empty or blank search', () => {
  assert.deepEqual(searchSettings(''), [])
  assert.deepEqual(searchSettings('   '), [])
})

test('finds a subcategory by name, case-insensitively', () => {
  const matches = searchSettings('STEAM')
  assert.ok(matches.some((match) => match.categoryId === 'quick-adjustments' && match.subcategory.id === 'steam'))
})

test('a category-name match returns every subcategory in that category', () => {
  const matches = searchSettings('bluetooth')
  assert.deepEqual(matches.map((match) => match.subcategory.id), ['machine', 'scale'])
})

test('matches carry the owning category so results can be grouped', () => {
  const matches = searchSettings('water')
  assert.ok(matches.every((match) => match.categoryName === 'Quick Adjustments'))
  assert.ok(matches.some((match) => match.subcategory.id === 'water-tank'))
})

test('returns no matches when nothing matches', () => {
  assert.deepEqual(searchSettings('zzzzz'), [])
})