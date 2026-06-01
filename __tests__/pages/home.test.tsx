import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Home from '@/app/page'
import { WalletProvider } from '@/app/context/WalletContext'

function renderHome() {
  return render(
    <WalletProvider>
      <Home />
    </WalletProvider>,
  )
}

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.ethereum = {
      request: jest.fn().mockResolvedValue([]),
      on: jest.fn(),
      removeListener: jest.fn(),
    }
  })

  it('renders the main heading', () => {
    renderHome()
    expect(screen.getByText(/Private Documents/i)).toBeInTheDocument()
    expect(screen.getByText(/Zero Trust Required/i)).toBeInTheDocument()
  })

  it('renders navigation with DealVault logo', () => {
    renderHome()
    expect(screen.getByText('DealVault')).toBeInTheDocument()
  })

  it('renders both feature cards', () => {
    renderHome()
    expect(screen.getByText('Deal Room')).toBeInTheDocument()
    expect(screen.getByText('Dead Drop')).toBeInTheDocument()
  })

  it('shows Connect Wallet button when not connected', () => {
    renderHome()
    expect(screen.getByRole('button', { name: /Connect Wallet/i })).toBeInTheDocument()
  })

  it('handles wallet connection successfully', async () => {
    const mockAccounts = ['0x1234567890123456789012345678901234567890']
    ;(window.ethereum.request as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(mockAccounts)

    renderHome()
    fireEvent.click(screen.getByRole('button', { name: /Connect Wallet/i }))

    await waitFor(() => {
      expect(window.ethereum.request).toHaveBeenCalledWith({ method: 'eth_requestAccounts' })
    })

    expect(await screen.findByText(/0x1234...7890/i)).toBeInTheDocument()
  })

  it('shows alert when MetaMask is not installed', async () => {
    const alertMock = jest.spyOn(window, 'alert').mockImplementation()
    const originalEthereum = window.ethereum
    delete window.ethereum

    renderHome()
    fireEvent.click(screen.getByRole('button', { name: /Connect Wallet/i }))

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Please install MetaMask or another Web3 wallet')
    })

    window.ethereum = originalEthereum
    alertMock.mockRestore()
  })

  it('renders Create Deal Room and Create Dead Drop CTAs', () => {
    renderHome()
    expect(screen.getAllByText(/Create Deal Room/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Create Dead Drop/i).length).toBeGreaterThan(0)
  })

  it('renders How it works section', () => {
    renderHome()
    expect(screen.getByText('How it works')).toBeInTheDocument()
    expect(screen.getByText('Upload & Encrypt')).toBeInTheDocument()
    expect(screen.getByText('Set Conditions')).toBeInTheDocument()
    expect(screen.getByText('Blockchain Enforces')).toBeInTheDocument()
  })

  it('shows Dashboard link when wallet is connected', async () => {
    const mockAccounts = ['0x1234567890123456789012345678901234567890']
    ;(window.ethereum.request as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(mockAccounts)

    renderHome()
    fireEvent.click(screen.getByRole('button', { name: /Connect Wallet/i }))

    expect(await screen.findByText('Dashboard')).toBeInTheDocument()
  })
})
