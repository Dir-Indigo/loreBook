import { adminService } from '../services/adminService';
import { createController } from './_base';

const handleLoading = createController('Admin').run;

export const adminController = {
  getProfiles: async (setLoading) => handleLoading(adminService.getProfiles(), setLoading),
  getPlatformStats: async (setLoading) => handleLoading(adminService.getPlatformStats(), setLoading),
  updateProfileRole: async (profileId, role, setLoading) =>
    handleLoading(adminService.updateProfileRole(profileId, role), setLoading),
};
