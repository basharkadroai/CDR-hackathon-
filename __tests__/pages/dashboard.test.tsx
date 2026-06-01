import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Dashboard from '@/app/dashboard/page'
import { WalletProvider } from '@/app/context/WalletContext'
import { cdrService } from '@/lib/cdr-service'

jest.mock('@/lib/cdr-service', () => ({
  cdrService: {
    listUserVaults: jest.fn(),
    accessVault: jest.fn(),
  },
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

function renderDashboard() {
  return render(
    <WalletProvider>
      <Dashboard />
    </WalletProvider>,
  )
}

describe('Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.ethereum = {
      request: jest.fn().mockResolvedValue([]),
      on: jest.fn(),
      removeListener: jest.fn(),
    }
  })

  it('shows connect wallet prompt when no wallet is connected', async () => {
    ;(window.ethereum.request as jest.Mock).mockResolvedValue([])

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('Connect your wallet')).toBeInTheDocument()
      expect(screen.getByText(/Connect your wallet to view and manage your vaults/i)).toBeInTheDocument()
    })
  })

  it('loads and displays vaults when wallet is connected', async () => {
    const mockAccounts = ['0x1234567890123456789012345678901234567890']
    const mockVaults = [
      {
        uuid: 'vault-1',
        name: 'Test Deal Room',
        type: 'deal-room',
        status: 'active',
        createdAt: Date.now(),
        expiresAt: Date.now() + 86400000,
      },
      {
        uuid: 'vault-2',
        name: 'Test Dead Drop',
        type: 'dead-drop',
        status: 'sealed',
        createdAt: Date.now(),
        unlockAt: Date.now() + 86400000,
      },
    ]

    ;(window.ethereum.request as jest.Mock).mockResolvedValue(mockAccounts)
    ;(cdrService.listUserVaults as jest.Mock).mockResolvedValue(mockVaults)

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('Test Deal Room')).toBeInTheDocument()
      expect(screen.getByText('Test Dead Drop')).toBeInTheDocument()
    })
  })

  it('shows empty state when no vaults exist', async () => {
    const mockAccounts = ['0x1234567890123456789012345678901234567890']
    ;(window.ethereum.request as jest.Mock).mockResolvedValue(mockAccounts)
    ;(cdrService.listUserVaults as jest.Mock).mockResolvedValue([])

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('No vaults yet')).toBeInTheDocument()
      expect(screen.getByText(/Create your first vault to get started/i)).toBeInTheDocument()
    })
  })

  it('displays vault status badges correctly', async () => {
    const mockAccounts = ['0x1234567890123456789012345678901234567890']
    const mockVaults = [
      {
        uuid: 'vault-1',
        name: 'Active Vault',
        type: 'deal-room',
        status: 'active',
        createdAt: Date.now(),
      },
      {
        uuid: 'vault-2',
        name: 'Sealed Vault',
        type: 'dead-drop',
        status: 'sealed',
        createdAt: Date.now(),
      },
      {
        uuid: 'vault-3',
        name: 'Expired Vault',
        type: 'deal-room',
        status: 'expired',
        createdAt: Date.now(),
      },
    ]

    ;(window.ethereum.request as jest.Mock).mockResolvedValue(mockAccounts)
    ;(cdrService.listUserVaults as jest.Mock).mockResolvedValue(mockVaults)

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('active')).toBeInTheDocument()
      expect(screen.getByText('sealed')).toBeInTheDocument()
      expect(screen.getByText('expired')).toBeInTheDocument()
    })
  })

  it('handles vault access correctly', async () => {
    const mockAccounts = ['0x1234567890123456789012345678901234567890']
    const mockVaults = [
      {
        uuid: 'vault-1',
        name: 'Test Vault',
        type: 'deal-room',
        status: 'active',
        createdAt: Date.now(),
      },
    ]
    const mockBlob = new Blob(['test content'], { type: 'application/pdf' })

    ;(window.ethereum.request as jest.Mock).mockResolvedValue(mockAccounts)
    ;(cdrService.listUserVaults as jest.Mock).mockResolvedValue(mockVaults)
    ;(cdrService.accessVault as jest.Mock).mockResolvedValue(mockBlob)

    const windowOpenMock = jest.spyOn(window, 'open').mockImplementation()

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('Test Vault')).toBeInTheDocument()
    })

    const accessButton = screen.getByRole('button', { name: /Access Vault/i })
    fireEvent.click(accessButton)

    await waitFor(() => {
      expect(cdrService.accessVault).toHaveBeenCalledWith('vault-1')
      expect(windowOpenMock).toHaveBeenCalled()
    })

    windowOpenMock.mockRestore()
  })

  it('disables access button for sealed and expired vaults', async () => {
    const mockAccounts = ['0x1234567890123456789012345678901234567890']
    const mockVaults = [
      {
        uuid: 'vault-1',
        name: 'Sealed Vault',
        type: 'dead-drop',
        status: 'sealed',
        createdAt: Date.now(),
      },
      {
        uuid: 'vault-2',
        name: 'Expired Vault',
        type: 'deal-room',
        status: 'expired',
        createdAt: Date.now(),
      },
    ]

    ;(window.ethereum.request as jest.Mock).mockResolvedValue(mockAccounts)
    ;(cdrService.listUserVaults as jest.Mock).mockResolvedValue(mockVaults)

    renderDashboard()

    await waitFor(() => {
      const buttons = screen.getAllByRole('button')
      const sealedButton = buttons.find(btn => btn.textContent === 'Sealed')
      const expiredButton = buttons.find(btn => btn.textContent === 'Expired')
      
      expect(sealedButton).toBeDisabled()
      expect(expiredButton).toBeDisabled()
    })
  })

  it('handles wallet connection from dashboard', async () => {
    const mockAccounts = ['0x1234567890123456789012345678901234567890']
    ;(window.ethereum.request as jest.Mock)
      .mockResolvedValueOnce([]) // Initial check
      .mockResolvedValueOnce(mockAccounts) // After connect
    ;(cdrService.listUserVaults as jest.Mock).mockResolvedValue([])

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('Connect your wallet')).toBeInTheDocument()
    })

    // Get the button in the main content area (not nav)
    const connectButtons = screen.getAllByRole('button', { name: /Connect Wallet/i })
    const mainConnectButton = connectButtons.find(btn => 
      btn.className.includes('inline-flex')
    )
    
    if (mainConnectButton) {
      fireEvent.click(mainConnectButton)

      await waitFor(() => {
        expect(window.ethereum.request).toHaveBeenCalledWith({
          method: 'eth_requestAccounts'
        })
      })
    }
  })

  it('displays wallet address in navigation when connected', async () => {
    const mockAccounts = ['0x1234567890123456789012345678901234567890']
    ;(window.ethereum.request as jest.Mock).mockResolvedValue(mockAccounts)
    ;(cdrService.listUserVaults as jest.Mock).mockResolvedValue([])

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText(/0x1234...7890/i)).toBeInTheDocument()
    })
  })
})
