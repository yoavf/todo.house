export interface TaskAnalysisResult {
  success: boolean
  task?: {
    title: string
    location?: string
  }
  error?: string
}
