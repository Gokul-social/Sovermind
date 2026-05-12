import { useAppStore } from './store/useAppStore'
import Layout from './components/layout/Layout'
import Monitor from './pages/Monitor'
import Scan    from './pages/Scan'
import Vault   from './pages/Vault'

export default function App() {
  const activePage = useAppStore((s) => s.activePage)

  return (
    <Layout>
      <div className="h-full animate-fade-in">
        {activePage === 'monitor' && <Monitor />}
        {activePage === 'scan'    && <Scan />}
        {activePage === 'vault'   && <Vault />}
      </div>
    </Layout>
  )
}
