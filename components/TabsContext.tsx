import type React from 'react'
import { createContext, useContext, useState } from 'react'

interface TabsContextType {
  viewMode: 'large' | 'compact'
  setViewMode: (mode: 'large' | 'compact') => void
  showFilters: boolean
  setShowFilters: (show: boolean) => void
}

const TabsContext = createContext<TabsContextType | undefined>(undefined)

export const TabsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [viewMode, setViewMode] = useState<'large' | 'compact'>('large')
  const [showFilters, setShowFilters] = useState(false)

  return (
    <TabsContext.Provider
      value={{ viewMode, setViewMode, showFilters, setShowFilters }}
    >
      {children}
    </TabsContext.Provider>
  )
}

export const useTabs = () => {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('useTabs must be used within a TabsProvider')
  }
  return context
}
