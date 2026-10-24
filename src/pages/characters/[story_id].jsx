import React from 'react';
import { useRouter } from 'next/router';
import CharactersWorkspaceView from '../../components/workspace/views/CharactersWorkspaceView';

export default function CharactersPage() {
  const router = useRouter();
  const { story_id } = router.query;
  return <CharactersWorkspaceView storyId={story_id} />;
}
