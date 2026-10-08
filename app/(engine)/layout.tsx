import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './engine.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains' })

export const metadata: Metadata = {
  title: '模板与流程引擎',
  description: '指令流转 MT 端 - 模板管理：表单 + 流程引擎配置与实例管理',
}

export default function EngineLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${jetbrainsMono.variable} bg-slate-50`}>
      <body className="font-sans antialiased text-slate-800">{children}</body>
    </html>
  )
}
