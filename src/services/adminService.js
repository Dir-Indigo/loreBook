import { profileRepository } from '../repositories/profileRepository';

const ALLOWED_ROLES = ['writer', 'superadmin'];

export const adminService = {
  getProfiles: async () => {
    const { data, error } = await profileRepository.getAll();
    if (error) throw error;
    return data || [];
  },

  getPlatformStats: async () => {
    const [users, stories, characters, events] = await Promise.all([
      profileRepository.countProfiles(),
      profileRepository.countStories(),
      profileRepository.countCharacters(),
      profileRepository.countEvents(),
    ]);
    const failed = [users, stories, characters, events].find((result) => result.error);
    if (failed) throw failed.error;

    return {
      totalUsers: users.count || 0,
      totalStories: stories.count || 0,
      totalCharacters: characters.count || 0,
      totalEvents: events.count || 0,
    };
  },

  updateProfileRole: async (profileId, role) => {
    if (!ALLOWED_ROLES.includes(role)) {
      throw new Error(`Rol no permitido: ${role}`);
    }
    const { data, error } = await profileRepository.updateRole(profileId, role);
    if (error) throw error;
    // Sin filas devueltas, la base de datos rechazó el cambio en silencio (RLS): no es un éxito
    if (!data || data.length === 0) {
      throw new Error('No tienes permisos para cambiar el rol de este usuario.');
    }
    return data[0];
  },
};
