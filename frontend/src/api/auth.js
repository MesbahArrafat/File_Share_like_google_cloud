import client from './client';
export const authApi = {
  register: d => client.post('/auth/register/', d),
  login:    d => client.post('/auth/login/', d),
  logout:   r => client.post('/auth/logout/', { refresh: r }),
  profile:  () => client.get('/auth/profile/'),
  updateProfile: d => client.patch('/auth/profile/', d),
  changePassword: d => client.post('/auth/change-password/', d),
};
