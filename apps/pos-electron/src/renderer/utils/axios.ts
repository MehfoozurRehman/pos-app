import { apiUrl } from '@/config';
import axiosBase from 'axios';

export const axios = axiosBase.create({
  baseURL: apiUrl,
});
