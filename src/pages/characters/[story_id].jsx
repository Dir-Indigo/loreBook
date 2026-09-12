import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Box, Typography, Button, Container, Grid, Divider } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useStory } from '../../context/StoryContext';
import { useLoading } from '../../context/LoadingContext'; // Add global loading
import { characterController } from '../../controllers/characterController'; // Add controller
import SidebarLore from '../../components/layout/SidebarLore';
import CustomLoading from '../../components/common/CustomLoading';
import CharacterModal from '../../components/characters/CharacterModal';
import CharacterCard from '../../components/characters/CharacterCard';

export default function CharacterManagementPage() {
  const router = useRouter();
  const { story_id } = router.query;
  const { user, loading: authLoading } = useAuth();
  const { activeStory, activeStoryId } = useStory();
  const { setLoading } = useLoading(); // Global loading controller

  useEffect(() => {
    if (activeStoryId && story_id && story_id !== activeStoryId) {
      router.push(`/characters/${activeStoryId}`);
    }
  }, [story_id, activeStoryId, router]);

  const [characters, setCharacters] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [charModalOpen, setCharModalOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [isCloneCharMode, setIsCloneCharMode] = useState(false);

  const loadData = useCallback(async () => {
    if (!story_id) return;
    setDataLoading(true);
    try {
        const result = await characterController.getAll(story_id, setLoading);
        setCharacters(result.data || []);
    } catch (e) {
        console.error(e);
        setCharacters([]);
    }
    setDataLoading(false);
  }, [story_id, setLoading]);

  useEffect(() => {
    if (story_id) {
      loadData();
    }
  }, [story_id, loadData]);

  const handleDelete = async (charId) => {
    if (window.confirm('¿Seguro que deseas eliminar este personaje?')) {
        await characterController.delete(charId, setLoading);
        await loadData();
    }
  };
  
  const handleClone = (char) => {
      setSelectedCharacter(char);
      setIsCloneCharMode(true);
      setCharModalOpen(true);
  };

  const handleCloneCharacter = async (originalCharId, cloneOptions) => {
    if (!story_id) return;
    await characterController.clone(originalCharId, {
        ...cloneOptions,
        targetStoryId: story_id,
    }, setLoading);
    await loadData();
    setCharModalOpen(false);
  };

  const handleSaveCharacter = async (charData) => {
    if (!story_id) return;
    
    if (selectedCharacter && !isCloneCharMode) {
        await characterController.update(selectedCharacter.id, charData, setLoading);
    } else {
        await characterController.create({
            ...charData,
            story_id: story_id,
        }, setLoading);
    }
    await loadData();
    setCharModalOpen(false);
  };

  // Grouping characters by archetype
  const groupedCharacters = useMemo(() => {
    return characters.reduce((acc, char) => {
      const archetype = char.role_archetype || 'Sin Rol';
      if (!acc[archetype]) acc[archetype] = [];
      acc[archetype].push(char);
      return acc;
    }, {});
  }, [characters]);

  if (authLoading || dataLoading) {
    return <CustomLoading fullscreen message="Cargando..." />;
  }

  return (
    <>
        <SidebarLore view="characters" story={activeStory} characters={characters} />
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>
          <Container>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>Gestión de Personajes</Typography>
                <Button variant="contained" onClick={() => { setSelectedCharacter(null); setIsCloneCharMode(false); setCharModalOpen(true); }}>
                Nuevo Personaje
                </Button>
            </Box>
            
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
    </>
  );
}
