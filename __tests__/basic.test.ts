// Basic test to verify Jest setup is working
describe('Jest Setup', () => {
  it('should be able to run basic tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('should support TypeScript', () => {
    const message: string = 'Hello, TypeScript!';
    expect(message).toBe('Hello, TypeScript!');
  });

  it('should support async/await', async () => {
    const promise = Promise.resolve('test');
    const result = await promise;
    expect(result).toBe('test');
  });
});