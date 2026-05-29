import '@testing-library/jest-dom'

// Mock window.ethereum for wallet tests
global.window = global.window || {}
global.window.ethereum = {
  request: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
}

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = jest.fn()

// Mock window.open
global.window.open = jest.fn()

// Mock window.alert
global.window.alert = jest.fn()
