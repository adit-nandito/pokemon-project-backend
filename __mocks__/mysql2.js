const executeMock = jest.fn();
const createPool = jest.fn().mockImplementation(() => ({
  promise: jest.fn().mockImplementation(() => ({
    getConnection: jest.fn().mockImplementation(() => ({
      query: executeMock,
      rollback: jest.fn(),
      release: jest.fn()
    }))
  }))
}));

module.exports = {
  createPool,
  executeMock
};
