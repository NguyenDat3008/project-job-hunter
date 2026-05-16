import api from './api';
import { ENDPOINTS } from '@constants/endpoints';

export interface Blog {
  id: number;
  title: string;
  summary: string;
  imageUrl: string;
  externalLink: string;
  createdAt: string;
}

export interface BlogResponse {
  meta: {
    page: number;
    pageSize: number;
    pages: number;
    total: number;
  };
  result: Blog[];
}

const blogService = {
  getBlogs: async (page = 1, size = 10, filter = '') => {
    const url = `${ENDPOINTS.BLOG.BASE}?page=${page}&size=${size}${filter ? `&filter=${filter}` : ''}`;
    return await api.get<BlogResponse>(url);
  },

  getBlogById: async (id: number) => {
    return await api.get<Blog>(`${ENDPOINTS.BLOG.BASE}/${id}`);
  },

  createBlog: async (data: Partial<Blog>) => {
    return await api.post<Blog>(ENDPOINTS.BLOG.BASE, data);
  },

  updateBlog: async (data: Partial<Blog>) => {
    return await api.put<Blog>(ENDPOINTS.BLOG.BASE, data);
  },

  deleteBlog: async (id: number) => {
    return await api.delete(`${ENDPOINTS.BLOG.BASE}/${id}`);
  },
};

export default blogService;
