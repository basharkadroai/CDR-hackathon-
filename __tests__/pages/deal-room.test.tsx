import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DealRoom from '@/app/deal-room/page'
import { cdrService } from '@/lib/cdr-service'
import toast from 'react-hot-toast'

jest.mock('@/lib/cdr-service', () => ({
  cdrService: {
    uploadVault: jest.fn(),
  },
}))

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    loading: jest.fn(() => 'toast-id'),
    success: jest.fn(),
  },
}))

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

function selectFile(file: File) {
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
  Object.defineProperty(fileInput, 'files', {
    value: [file],
    configurable: true,
  })
  fireEvent.change(fileInput)
}

describe('Deal Room Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
  })

  it('renders the deal room creation form', () => {
    render(<DealRoom />)

    expect(screen.getByRole('heading', { name: /Create a Deal Room/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Series A/i)).toBeInTheDocument()
    expect(screen.getByText('Documents')).toBeInTheDocument()
    expect(screen.getByText('Authorized Wallets')).toBeInTheDocument()
    expect(screen.getByText('Access Duration')).toBeInTheDocument()
  })

  it('allows adding multiple wallet addresses', () => {
    render(<DealRoom />)

    fireEvent.click(screen.getByText(/Add another wallet/i))

    expect(screen.getAllByPlaceholderText('0x...')).toHaveLength(2)
  })

  it('allows removing wallet addresses', () => {
    render(<DealRoom />)

    fireEvent.click(screen.getByText(/Add another wallet/i))
    expect(screen.getAllByPlaceholderText('0x...')).toHaveLength(2)

    fireEvent.click(document.querySelector('.dr-wallet-remove') as HTMLButtonElement)
    expect(screen.getAllByPlaceholderText('0x...')).toHaveLength(1)
  })

  it('shows validation toast when name is missing', async () => {
    render(<DealRoom />)

    fireEvent.click(screen.getByRole('button', { name: /Create Deal Room/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Please provide a name for your Deal Room',
        expect.any(Object),
      )
    })
  })

  it('shows validation toast when no files are uploaded', async () => {
    render(<DealRoom />)

    fireEvent.change(screen.getByPlaceholderText(/Series A/i), { target: { value: 'Test Deal' } })
    fireEvent.click(screen.getByRole('button', { name: /Create Deal Room/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please upload at least one document', expect.any(Object))
    })
  })

  it('shows validation toast when no wallet addresses are provided', async () => {
    render(<DealRoom />)

    fireEvent.change(screen.getByPlaceholderText(/Series A/i), { target: { value: 'Test Deal' } })
    selectFile(new File(['test'], 'test.pdf', { type: 'application/pdf' }))
    fireEvent.click(screen.getByRole('button', { name: /Create Deal Room/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Please add at least one authorized wallet address',
        expect.any(Object),
      )
    })
  })

  it('successfully creates a deal room with valid data', async () => {
    jest.useFakeTimers()
    ;(cdrService.uploadVault as jest.Mock).mockResolvedValue({ uuid: 'vault-1' })

    render(<DealRoom />)

    fireEvent.change(screen.getByPlaceholderText(/Series A/i), { target: { value: 'Test Deal' } })
    fireEvent.change(screen.getByPlaceholderText('0x...'), {
      target: { value: '0x1234567890123456789012345678901234567890' },
    })
    selectFile(new File(['test'], 'test.pdf', { type: 'application/pdf' }))
    fireEvent.click(screen.getByRole('button', { name: /Create Deal Room/i }))

    await waitFor(() => {
      expect(cdrService.uploadVault).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'deal-room', authorizedWallets: ['0x1234567890123456789012345678901234567890'] }),
      )
      expect(toast.success).toHaveBeenCalled()
    })

    jest.runOnlyPendingTimers()
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('displays selected files', () => {
    render(<DealRoom />)

    selectFile(new File(['test'], 'test.pdf', { type: 'application/pdf' }))

    expect(screen.getByText('test.pdf')).toBeInTheDocument()
  })

  it('shows loading state during upload', async () => {
    ;(cdrService.uploadVault as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ uuid: 'vault-1' }), 100)),
    )

    render(<DealRoom />)

    fireEvent.change(screen.getByPlaceholderText(/Series A/i), { target: { value: 'Test Deal' } })
    fireEvent.change(screen.getByPlaceholderText('0x...'), {
      target: { value: '0x1234567890123456789012345678901234567890' },
    })
    selectFile(new File(['test'], 'test.pdf', { type: 'application/pdf' }))
    fireEvent.click(screen.getByRole('button', { name: /Create Deal Room/i }))

    expect(await screen.findByText(/Uploading 1 of 1/i)).toBeInTheDocument()
  })

  it('handles upload failure gracefully', async () => {
    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation()
    ;(cdrService.uploadVault as jest.Mock).mockRejectedValue(new Error('Upload failed'))

    render(<DealRoom />)

    fireEvent.change(screen.getByPlaceholderText(/Series A/i), { target: { value: 'Test Deal' } })
    fireEvent.change(screen.getByPlaceholderText('0x...'), {
      target: { value: '0x1234567890123456789012345678901234567890' },
    })
    selectFile(new File(['test'], 'test.pdf', { type: 'application/pdf' }))
    fireEvent.click(screen.getByRole('button', { name: /Create Deal Room/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to create Deal Room. Please try again.', expect.any(Object))
    })

    consoleErrorMock.mockRestore()
  })

  it('has Dashboard link in navigation', () => {
    render(<DealRoom />)

    expect(screen.getByText(/Dashboard/i).closest('a')).toHaveAttribute('href', '/dashboard')
  })
})
