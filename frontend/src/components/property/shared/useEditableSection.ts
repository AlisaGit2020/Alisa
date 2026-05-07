import { useCallback } from 'react';

export interface EditableSectionState {
  editing: boolean;
  toggle: () => void;
}

export function useEditableSection(
  activeKey: string | null,
  setActiveKey: (key: string | null) => void,
  sectionKey: string
): EditableSectionState {
  const editing = activeKey === sectionKey;
  const toggle = useCallback(() => {
    setActiveKey(editing ? null : sectionKey);
  }, [editing, sectionKey, setActiveKey]);

  return { editing, toggle };
}
