import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Home from '@/app/page'

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the main heading', () => {
    render(<Home />)
    expect(screen.getByText(/Private Documents/i)).toBeInTheDocument()
    expect(screen.getByText(/Zero Trust Required/i)).toBeInTheDocument()
  })

  it('renders navigation with DealVault logo', () => {
    render(<Home />)
    expect(screen.getByText('DealVault')).toBeInTheDocument()
  })

  it('renders both feature cards', () => {
    render(<Home />)
    expect(screen.getByText('Deal Room')).toBeInTheDocument()
    expect(screen.getByText('Dead Drop')).toBeInTheDocument()
  })

  it('shows Connect Wallet button when not connected', () => {
    render(<Home />)
    const connectButton = screen.getByRole('button', { name: /Connect Wallet/i })
    expect(connectButton).toBeInTheDocument()
  })

  it('handles wallet connection successfully', async () => {
    const mockAccounts = ['0x1234567890123456789012345678901234567890']
    ;(window.ethereum.request as jest.Mock).mockResolvedValue(mockAccounts)

    render(<Home />)
    const connectButton = screen.getByRole('button', { name: /Connect Wallet/i })
    
    fireEvent.click(connectButton)

    await waitFor(() => {
      expect(window.ethereum.request).toHaveBeenCalledWith({
        method: 'eth_requestAccounts'
      })
    })

    await waitFor(() => {
      expect(screen.getByText(/0x1234...7890/i)).toBeInTheDocument()
    })
  })

  it('shows alert when MetaMask is not installed', async () => {
    const alertMock = jest.spyOn(window, 'alert').mockImplementation()
    const originalEthereum = window.ethereum
    
    // @ts-ignore
    delete window.ethereum

    render(<Home />)
    const connectButton = screen.getByRole('button', { name: /Connect Wallet/i })
    
    fireEvent.click(connectButton)

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Please install MetaMask or another Web3 wallet')
    })

    window.ethereum = originalEthereum
    alertMock.mockRestore()
  })

  it('renders Create Deal Room and Create Dead Drop CTAs', () => {
    render(<Home />)
    const dealRoomLinks = screen.getAllByText(/Create Deal Room/i)
    const deadDropLinks = screen.getAllByText(/Create Dead Drop/i)
    
    expect(dealRoomLinks.length).toBeGreaterThan(0)
    expect(deadDropLinks.length).toBeGreaterThan(0)
  })

  it('renders How it works section', () => {
    render(<Home />)
    expect(screen.getByText('How it works')).toBeInTheDocument()
    expect(screen.getByText('Upload & Encrypt')).toBeInTheDocument()
    expect(screen.getByText('Set Conditions')).toBeInTheDocument()
    expect(screen.getByText('Smart Contract Enforces')).toBeInTheDocument()
  })

  it('shows Dashboard link when wallet is connected', async () => {
    const mockAccounts = ['0x1234567890123456789012345678901234567890']
    ;(window.ethereum.request as jest.Mock).mockResolvedValue(mockAccounts)

    render(<Home />)
    const connectButton = screen.getByRole('button', { name: /Connect Wallet/i })
    
    fireEvent.click(connectButton)

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })
  })
})
