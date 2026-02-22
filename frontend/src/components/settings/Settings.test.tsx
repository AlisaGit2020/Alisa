import '@testing-library/jest-dom';
import { SettingsPage, Action } from './Settings';

// Unit tests for Settings enums and types
describe('Settings enums', () => {
  describe('SettingsPage enum', () => {
    it('has correct Theme value', () => {
      expect(SettingsPage.Theme).toBe('theme');
    });
  });

  describe('Action enum', () => {
    it('has correct Add value', () => {
      expect(Action.Add).toBe('add');
    });

    it('has correct Edit value', () => {
      expect(Action.Edit).toBe('edit');
    });

    it('has correct List value', () => {
      expect(Action.List).toBe('');
    });
  });
});
