import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DealRoom from '@/app/deal-room/page'
import { cdrService } from '@/lib/cdr-service'

jest.mock('@/lib/cdr-service', () => ({
  cdrService: {
    uploadVault: jest.fn(),
  },
}))

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('Deal Room Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the deal room creation form', () => {
    render(<DealRoom />)
    
    expect(screen.getByRole('heading', { name: /Create Deal Room/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Series A/i)).toBeInTheDocument()
    expect(screen.getByText('Upload Documents')).toBeInTheDocument()
    expect(screen.getByText('Authorized Wallets')).toBeInTheDocument()
    expect(screen.getByText('Access Duration')).toBeInTheDocument()
  })

  it('allows adding multiple wallet addresses', () => {
    render(<DealRoom />)
    
    const addButton = screen.getByText(/Add Another Wallet/i)
    fireEvent.click(addButton)
    
    const walletInputs = screen.getAllByPlaceholderText('0x...')
    expect(walletInputs.length).toBe(2)
  })

  it('allows removing wallet addresses', () => {
    render(<DealRoom />)
    
    const addButton = screen.getByText(/Add Another Wallet/i)
    fireEvent.click(addButton)
    
    let walletInputs = screen.getAllByPlaceholderText('0x...')
    expect(walletInputs.length).toBe(2)
    
    const deleteButtons = screen.getAllByRole('button')
    const deleteButton = deleteButtons.find(btn => 
      btn.querySelector('svg') && btn.className.includes('bg-[#4d1a1a]')
    )
    
    if (deleteButton) {
      fireEvent.click(deleteButton)
      walletInputs = screen.getAllByPlaceholderText('0x...')
      expect(walletInputs.length).toBe(1)
    }
  })

  it('shows validation alert when name is missing', async () => {
    const alertMock = jest.spyOn(window, 'alert').mockImplementation()
    
    render(<DealRoom />)
    
    const submitButton = screen.getByRole('button', { name: /Create Deal Room/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Please provide a name and upload at least one file')
    })
    
    alertMock.mockRestore()
  })

  it('shows validation alert when no files are uploaded', async () => {
    const alertMock = jest.spyOn(window, 'alert').mockImplementation()
    
    render(<DealRoom />)
    
    const nameInput = screen.getByPlaceholderText(/Series A/i)
    fireEvent.change(nameInput, { target: { value: 'Test Deal' } })
    
    const submitButton = screen.getByRole('button', { name: /Create Deal Room/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Please provide a name and upload at least one file')
    })
    
    alertMock.mockRestore()
  })

  it('shows validation alert when no wallet addresses are provided', async () => {
    const alertMock = jest.spyOn(window, 'alert').mockImplementation()
    
    render(<DealRoom />)
    
    const nameInput = screen.getByPlaceholderText(/Series A/i)
    fireEvent.change(nameInput, { target: { value: 'Test Deal' } })
    
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    
    if (fileInput) {
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      })
      fireEvent.change(fileInput)
    }
    
    const submitButton = screen.getByRole('button', { name: /Create Deal Room/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Please add at least one authorized wallet address')
    })
    
    alertMock.mockRestore()
  })

  it('successfully creates a deal room with valid data', async () => {
    const alertMock = jest.spyOn(window, 'alert').mockImplementation()
    ;(cdrService.uploadVault as jest.Mock).mockResolvedValue({ success: true })
    
    render(<DealRoom />)
    
    const nameInput = screen.getByPlaceholderText(/Series A/i)
    fireEvent.change(nameInput, { target: { value: 'Test Deal' } })
    
    const walletInput = screen.getByPlaceholderText('0x...')
    fireEvent.change(walletInput, { target: { value: '0x1234567890123456789012345678901234567890' } })
    
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    
    if (fileInput) {
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      })
      fireEvent.change(fileInput)
    }
    
    const submitButton = screen.getByRole('button', { name: /Create Deal Room/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(cdrService.uploadVault).toHaveBeenCalled()
      expect(alertMock).toHaveBeenCalledWith('Deal Room created successfully!')
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
    
    alertMock.mockRestore()
  })

  it('displays file count when files are selected', () => {
    render(<DealRoom />)
    
    const file1 = new File(['test1'], 'test1.pdf', { type: 'application/pdf' })
    const file2 = new File(['test2'], 'test2.pdf', { type: 'application/pdf' })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    
    if (fileInput) {
      Object.defineProperty(fileInput, 'files', {
        value: [file1, file2],
        writable: false,
      })
      fireEvent.change(fileInput)
      
      expect(screen.getByText('2 files selected')).toBeInTheDocument()
    }
  })

  it('shows loading state during upload', async () => {
    ;(cdrService.uploadVault as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    )
    
    render(<DealRoom />)
    
    const nameInput = screen.getByPlaceholderText(/Series A/i)
    fireEvent.change(nameInput, { target: { value: 'Test Deal' } })
    
    const walletInput = screen.getByPlaceholderText('0x...')
    fireEvent.change(walletInput, { target: { value: '0x1234567890123456789012345678901234567890' } })
    
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    
    if (fileInput) {
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      })
      fireEvent.change(fileInput)
    }
    
    const submitButton = screen.getByRole('button', { name: /Create Deal Room/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Creating Deal Room.../i)).toBeInTheDocument()
    })
  })

  it('handles upload failure gracefully', async () => {
    const alertMock = jest.spyOn(window, 'alert').mockImplementation()
    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation()
    ;(cdrService.uploadVault as jest.Mock).mockRejectedValue(new Error('Upload failed'))
    
    render(<DealRoom />)
    
    const nameInput = screen.getByPlaceholderText(/Series A/i)
    fireEvent.change(nameInput, { target: { value: 'Test Deal' } })
    
    const walletInput = screen.getByPlaceholderText('0x...')
    fireEvent.change(walletInput, { target: { value: '0x1234567890123456789012345678901234567890' } })
    
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    
    if (fileInput) {
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      })
      fireEvent.change(fileInput)
    }
    
    const submitButton = screen.getByRole('button', { name: /Create Deal Room/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Failed to create Deal Room')
    })
    
    alertMock.mockRestore()
    consoleErrorMock.mockRestore()
  })

  it('has Dashboard link in navigation', () => {
    render(<DealRoom />)
    
    const dashboardLink = screen.getByText(/← Dashboard/i)
    expect(dashboardLink).toBeInTheDocument()
    expect(dashboardLink.closest('a')).toHaveAttribute('href', '/dashboard')
  })
})
