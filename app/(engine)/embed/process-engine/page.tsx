import { ProcessEngineEmbed } from '@/modules/process-engine/ProcessEngineEmbed'

export default async function ProcessEnginePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const { view } = await searchParams
  return <ProcessEngineEmbed view={view === 'instances' ? 'instances' : 'config'} />
}
