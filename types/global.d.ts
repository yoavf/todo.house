interface Window {
  __CI_MODE__?: boolean
  AsyncStorage?: {
    data: Record<string, string>
    getItem(key: string): Promise<string | null>
    setItem(key: string, value: string): Promise<void>
    removeItem(key: string): Promise<void>
    clear(): Promise<void>
  }
}
