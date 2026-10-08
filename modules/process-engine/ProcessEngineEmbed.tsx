'use client'

import { ProcessManagementPage } from './components/process/ProcessManagementPage'
import { ProcessInstanceManagerView } from './components/process/ProcessInstanceManagerView'

export function ProcessEngineEmbed({ view }: { view: 'config' | 'instances' }) {
  return (
    <main className="flex min-h-screen w-full flex-col bg-slate-50">
      {view === 'instances' ? <ProcessInstanceManagerView /> : <ProcessManagementPage />}
    </main>
  )
}
