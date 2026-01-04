import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  effectiveTheme: 'light' | 'dark';
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyTheme = (theme: Theme) => {
  if (typeof window === 'undefined') return;
  
  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');
  
  let effectiveTheme: 'light' | 'dark';
  if (theme === 'system') {
    effectiveTheme = getSystemTheme();
  } else {
    effectiveTheme = theme;
  }
  
  root.classList.add(effectiveTheme);
  return effectiveTheme;
};

export const useThemeStore = create<ThemeState>((set, get) => {
  // Initialize theme on store creation
  const initialTheme = (typeof window !== 'undefined' ? (localStorage.getItem('theme') as Theme) : null) || 'system';
  const effectiveTheme = applyTheme(initialTheme);
  
  // Listen for system theme changes
  if (typeof window !== 'undefined' && initialTheme === 'system') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const currentTheme = get().theme;
      if (currentTheme === 'system') {
        const newEffectiveTheme = applyTheme('system');
        set({ effectiveTheme: newEffectiveTheme! });
      }
    };
    mediaQuery.addEventListener('change', handleChange);
  }
  
  return {
    theme: initialTheme,
    effectiveTheme: effectiveTheme || 'light',
    setTheme: (theme: Theme) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', theme);
      }
      const effectiveTheme = applyTheme(theme);
      set({ theme, effectiveTheme: effectiveTheme! });
      
      // Update listener if switching to/from system
      if (typeof window !== 'undefined') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        if (theme === 'system') {
          const handleChange = () => {
            const newEffectiveTheme = applyTheme('system');
            set({ effectiveTheme: newEffectiveTheme! });
          };
          mediaQuery.addEventListener('change', handleChange);
        }
      }
    },
  };
});

// Initialize theme on module load
if (typeof window !== 'undefined') {
  const storedTheme = (localStorage.getItem('theme') as Theme) || 'system';
  applyTheme(storedTheme);
}

