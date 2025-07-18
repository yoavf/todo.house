import { config } from '@tamagui/config/v3'
import { createTamagui } from 'tamagui'

const tamaguiConfig = createTamagui({
  ...config,
  themes: {
    ...config.themes,
    // Custom themes for todo.house
    light: {
      ...config.themes.light,
      // Primary brand color
      color1: '#007AFF', // iOS blue
      color2: '#0A84FF',
      color3: '#0066CC',
      color4: '#004C99',
      
      // Background colors
      background: '#FFFFFF',
      backgroundStrong: '#F2F2F7',
      backgroundSoft: '#FAFAFA',
      
      // Success/Complete colors
      green1: '#34C759',
      green2: '#30D158',
      green3: '#28A745',
      
      // Warning/Snooze colors
      orange1: '#FF9F0A',
      orange2: '#FF8800',
      orange3: '#E67E00',
      
      // Error/Delete colors
      red1: '#FF3B30',
      red2: '#FF453A',
      red3: '#D70015',
    },
    dark: {
      ...config.themes.dark,
      // Primary brand color
      color1: '#0A84FF',
      color2: '#007AFF',
      color3: '#0066CC',
      color4: '#004C99',
      
      // Background colors
      background: '#000000',
      backgroundStrong: '#1C1C1E',
      backgroundSoft: '#2C2C2E',
      
      // Success/Complete colors
      green1: '#30D158',
      green2: '#34C759',
      green3: '#28A745',
      
      // Warning/Snooze colors
      orange1: '#FF9F0A',
      orange2: '#FF8800',
      orange3: '#E67E00',
      
      // Error/Delete colors
      red1: '#FF453A',
      red2: '#FF3B30',
      red3: '#D70015',
    },
  },
  tokens: {
    ...config.tokens,
    space: {
      ...config.tokens.space,
      // Custom spacing for todo.house
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 48,
    },
    radius: {
      ...config.tokens.radius,
      // iOS-style rounded corners
      card: 12,
      button: 8,
      input: 6,
      sheet: 16,
    },
  },
})

export type AppConfig = typeof tamaguiConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig