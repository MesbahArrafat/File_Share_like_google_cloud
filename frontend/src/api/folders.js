import client from './client';
export const foldersApi = {
  list:   p => client.get('/folders/', { params: p }),
  tree:   () => client.get('/folders/tree/'),
  create: d => client.post('/folders/', d),
  update: (id, d) => client.patch(`/folders/${id}/`, d),
  delete: id => client.delete(`/folders/${id}/`),
  move:   (id, parent) => client.post(`/folders/${id}/move/`, { parent }),
};
