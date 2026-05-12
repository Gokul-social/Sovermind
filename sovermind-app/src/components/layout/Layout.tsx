import { type ReactNode } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen overflow-hidden bg-background bg-grid">
      <Sidebar />
      <Header />
      <main className="ml-64 mt-16 h-[calc(100vh-64px)] overflow-hidden">
        {children}
      </main>
    </div>
  )
}
