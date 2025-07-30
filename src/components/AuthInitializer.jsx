import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { authAPI } from '@/lib/api';

export default function AuthInitializer() {
  const { isAuthenticated, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      // 检查是否有存储的token
      const token = localStorage.getItem('auth_token');
      if (token) {
        // 验证token是否有效
        authAPI.refresh()
          .then(response => {
            // Token有效，更新用户信息
            const { user, token: newToken } = response.data;
            useAuthStore.getState().login(user, newToken);
          })
          .catch(error => {
            console.error('Token validation failed:', error);
            // Token无效，清除存储的数据
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
          });
      }
    }
  }, [hasHydrated, isAuthenticated]);

  return null; // 这个组件不渲染任何内容
} 