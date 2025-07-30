import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Auth store
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      hasHydrated: false,
      
      login: (user, token) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
      },
      
      logout: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
      },
      
      setHasHydrated: (state) => set({ hasHydrated: state }),

      updateUser: (userData) => {
        const updatedUser = { ...get().user, ...userData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        set({ user: updatedUser });
      },

      // 初始化认证状态
      initializeAuth: () => {
        const token = localStorage.getItem('auth_token');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            set({ user, token, isAuthenticated: true });
          } catch (error) {
            console.error('Failed to parse user data:', error);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            set({ user: null, token: null, isAuthenticated: false });
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state.setHasHydrated(true);
        // 在hydration完成后初始化认证状态
        state.initializeAuth();
      },
    }
  )
);

// App store for general application state
export const useAppStore = create((set) => ({
  // UI state
  sidebarOpen: true,
  darkMode: false,
  
  // Data state
  devices: [],
  filters: [],
  selectedDevice: null,
  selectedDateRange: {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    end: new Date(),
  },
  
  // Actions
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  
  setDevices: (devices) => set({ devices }),
  setFilters: (filters) => set({ filters }),
  setSelectedDevice: (device) => set({ selectedDevice: device }),
  setSelectedDateRange: (dateRange) => set({ selectedDateRange: dateRange }),
  
  // Device management
  addDevice: (device) => set((state) => ({ 
    devices: [...state.devices, device] 
  })),
  updateDevice: (id, updatedDevice) => set((state) => ({
    devices: state.devices.map(device => 
      device.id === id ? { ...device, ...updatedDevice } : device
    )
  })),
  removeDevice: (id) => set((state) => ({
    devices: state.devices.filter(device => device.id !== id),
    selectedDevice: state.selectedDevice?.id === id ? null : state.selectedDevice
  })),
  
  // Filter management
  addFilter: (filter) => set((state) => ({ 
    filters: [...state.filters, filter] 
  })),
  updateFilter: (id, updatedFilter) => set((state) => ({
    filters: state.filters.map(filter => 
      filter.id === id ? { ...filter, ...updatedFilter } : filter
    )
  })),
  removeFilter: (id) => set((state) => ({
    filters: state.filters.filter(filter => filter.id !== id)
  })),
}));

// Dashboard store for dashboard-specific state
export const useDashboardStore = create((set) => ({
  // Dashboard data
  stats: null,
  hourlyStats: [],
  topApplications: [],
  topProtocols: [],
  topHosts: [],
  recentFlows: [],
  
  // Loading states
  loading: {
    stats: false,
    hourlyStats: false,
    topApplications: false,
    topProtocols: false,
    topHosts: false,
    recentFlows: false,
  },
  
  // Actions
  setStats: (stats) => set({ stats }),
  setHourlyStats: (hourlyStats) => set({ hourlyStats }),
  setTopApplications: (topApplications) => set({ topApplications }),
  setTopProtocols: (topProtocols) => set({ topProtocols }),
  setTopHosts: (topHosts) => set({ topHosts }),
  setRecentFlows: (recentFlows) => set({ recentFlows }),
  
  setLoading: (key, value) => set((state) => ({
    loading: { ...state.loading, [key]: value }
  })),
  
  // Clear all data
  clearData: () => set({
    stats: null,
    hourlyStats: [],
    topApplications: [],
    topProtocols: [],
    topHosts: [],
    recentFlows: [],
    loading: {
      stats: false,
      hourlyStats: false,
      topApplications: false,
      topProtocols: false,
      topHosts: false,
      recentFlows: false,
    },
  }),
}));

