import React from 'react';
import PlaceholderScreen from '@/screens/PlaceholderScreen.tsx';

/**
 * Tạo (Create / Import) tab — turn a Source into a Lesson
 * (docs/design/screens.md §13). Placeholder for now.
 */
const CreateScreen: React.FC = () => (
  <PlaceholderScreen
    titleKey={'TAB_CREATE'}
    subtitleKey={'CREATE_PLACEHOLDER_DESC'}
    icon={'Plus'}
  />
);

export default CreateScreen;
