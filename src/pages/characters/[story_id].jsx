import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Box, Typography, Button, Container, Grid, Divider, Tabs, Tab } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useStory } from '../../context/StoryContext';
import { useLoading } from '../../context/LoadingContext'; // Add global loading
import { ApiService } from '../../utils/ApiService';
import SidebarLore from '../../components/layout/SidebarLore';
import CustomLoading from '../../components/common/CustomLoading';
import SelectionActionBar from '../../components/common/SelectionActionBar';
import CharacterModal from '../../components/characters/CharacterModal';
import CharacterCard from '../../components/characters/CharacterCard';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';

export default function CharacterManagementPage() {
  const router = useRouter();
  const { story_id } = router.query;
  const { user, loading: authLoading } = useAuth();
  const { activeStory } = useStory();
  const { setLoading } = useLoading(); // Global loading controller

  const [characters, setCharacters] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [charModalOpen, setCharModalOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [isCloneCharMode, setIsCloneCharMode] = useState(false);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState([]);
  const [characterTab, setCharacterTab] = useState(0);

  const loadData = useCallback(async () => {
    if (!router.isReady || !story_id) return;
    setDataLoading(true);
    try {
        const result = await ApiService.characters.getAll(story_id, setLoading);
        setCharacters(result.data || []);
    } catch (e) {
        console.error(e);
        setCharacters([]);
    }
    setDataLoading(false);
  }, [router.isReady, story_id, setLoading]);

  useEffect(() => {
    if (router.isReady && story_id) {
      loadData();
    }
  }, [router.isReady, story_id, loadData]);

  const handleDelete = async (charId) => {
    if (window.confirm('¿Seguro que deseas eliminar este personaje?')) {
        const result = await ApiService.characters.delete(charId, setLoading);
        if (!result.error) {
          setCharacters((current) => current.filter((character) => character.id !== charId));
          setSelectedCharacterIds((current) => current.filter((id) => id !== charId));
        }
    }
  };

  const toggleCharacterSelection = (characterId, event) => {
    if (!event?.ctrlKey && !event?.metaKey) {
      setSelectedCharacterIds([characterId]);
      return;
    }

    setSelectedCharacterIds((current) => current.includes(characterId)
      ? current.filter((id) => id !== characterId)
      : [...current, characterId]);
  };

  const handleSetSelectedGlobal = async (isGlobal) => {
    if (!selectedCharacterIds.length) return;
    const previousCharacters = characters;
    const selectedIds = [...selectedCharacterIds];
    setCharacters((current) => current.map((character) => (
      selectedIds.includes(character.id) ? { ...character, is_global: isGlobal } : character
    )));

    const results = await Promise.all(selectedIds.map((characterId) =>
      ApiService.characters.update(characterId, { is_global: isGlobal }, setLoading)
    ));

    if (results.some((result) => result.error)) {
      setCharacters(previousCharacters);
      window.alert('No se pudo actualizar uno o más personajes.');
      return;
    }

    setSelectedCharacterIds([]);
  };
  
  const handleClone = (char) => {
      setSelectedCharacter(char);
      setIsCloneCharMode(true);
      setCharModalOpen(true);
  };

  const handleCloneCharacter = async (originalCharId, cloneOptions) => {
    if (!story_id) return;
    const result = await ApiService.characters.clone(originalCharId, {
        ...cloneOptions,
        targetStoryId: story_id,
    }, setLoading);
    if (!result.error && result.data) {
      setCharacters((current) => [...current, result.data].sort((a, b) => a.name.localeCompare(b.name)));
    }
    setCharModalOpen(false);
  };

  const handleSaveCharacter = async (charData) => {
    if (!story_id) return;

    const result = selectedCharacter && !isCloneCharMode
      ? await ApiService.characters.update(selectedCharacter.id, charData, setLoading)
      : await ApiService.characters.create({
          ...charData,
          story_id,
        }, setLoading);

    if (!result.error && result.data) {
      setCharacters((current) => selectedCharacter && !isCloneCharMode
        ? current.map((character) => character.id === selectedCharacter.id ? result.data : character)
        : [...current, result.data].sort((a, b) => a.name.localeCompare(b.name)));
    } else {
      return;
    }
    setCharModalOpen(false);
  };

  const visibleCharacters = characterTab === 1
    ? characters.filter((character) => character.is_global)
    : characters;

  // Grouping characters by archetype
  const groupedCharacters = useMemo(() => {
    return visibleCharacters.reduce((acc, char) => {
      const archetype = char.role_archetype || 'Sin Rol';
      if (!acc[archetype]) acc[archetype] = [];
      acc[archetype].push(char);
      return acc;
    }, {});
  }, [visibleCharacters]);

  if (authLoading || dataLoading) {
    return <CustomLoading fullscreen message="Cargando personajes..." />;
  }

  return (
    <>
        <SidebarLore view="characters" story={activeStory} characters={characters} />
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>
          <Container>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>Gestión de Personajes</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button variant="contained" onClick={() => { setSelectedCharacter(null); setIsCloneCharMode(false); setCharModalOpen(true); }}>
                    Nuevo Personaje
                  </Button>
                </Box>
            </Box>

            <Tabs value={characterTab} onChange={(event, value) => setCharacterTab(value)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
              <Tab icon={<PeopleOutlineIcon fontSize="small" />} iconPosition="start" label={`Todos (${characters.length})`} />
              <Tab icon={<PublicOutlinedIcon fontSize="small" />} iconPosition="start" label={`Globales (${characters.filter((character) => character.is_global).length})`} />
            </Tabs>
            
            {Object.entries(groupedCharacters).map(([archetype, chars]) => (
                <Box key={archetype} sx={{ mb: 6 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.9rem' }}>
                        {archetype} ({chars.length})
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    <Grid container spacing={3}>
                        {chars.map((char) => (
                            <Grid item key={char.id} xs={12} sm={6} md={4} lg={3}>
                                <CharacterCard 
                                    character={char} 
                                    selectable
                                    selected={selectedCharacterIds.includes(char.id)}
                                    onSelect={toggleCharacterSelection}
                                    onEdit={(char) => { setSelectedCharacter(char); setIsCloneCharMode(false); setCharModalOpen(true); }}
                                    onDelete={handleDelete}
                                    onClone={handleClone}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            ))}
          </Container>
        </Box>
      
      <CharacterModal
        open={charModalOpen}
        onClose={() => setCharModalOpen(false)}
        character={selectedCharacter}
        isCloneMode={isCloneCharMode}
        onSave={handleSaveCharacter}
        onClone={handleCloneCharacter}
      />

      <SelectionActionBar
        count={selectedCharacterIds.length}
        onClear={() => setSelectedCharacterIds([])}
        actions={[
          {
            key: 'make-global',
            label: 'Hacer globales',
            tooltip: 'Hacer globales',
            icon: <PublicOutlinedIcon fontSize="small" />,
            onClick: () => handleSetSelectedGlobal(true),
            color: 'secondary',
          },
          {
            key: 'remove-global',
            label: 'Quitar global',
            tooltip: 'Quitar estado global',
            icon: <PeopleOutlineIcon fontSize="small" />,
            onClick: () => handleSetSelectedGlobal(false),
          },
        ]}
      />
    </>
  );
}
