describe('Example Test Suite', () => {
  describe('Basic Math Operations', () => {
    test('should add two numbers correctly', () => {
      const a = 5;
      const b = 10;
      expect(a + b).toBe(15);
    });

    test('should subtract two numbers correctly', () => {
      const a = 10;
      const b = 3;
      expect(a - b).toBe(7);
    });

    test('should multiply two numbers correctly', () => {
      const a = 4;
      const b = 7;
      expect(a * b).toBe(28);
    });

    test('should divide two numbers correctly', () => {
      const a = 20;
      const b = 4;
      expect(a / b).toBe(5);
    });
  });

  describe('String Operations', () => {
    test('should concatenate strings', () => {
      const str1 = 'Hello';
      const str2 = 'World';
      expect(str1 + ' ' + str2).toBe('Hello World');
    });

    test('should get string length', () => {
      const str = 'TypeScript';
      expect(str.length).toBe(10);
    });
  });

  describe('Array Operations', () => {
    test('should create array', () => {
      const arr = [1, 2, 3, 4, 5];
      expect(arr.length).toBe(5);
      expect(arr[0]).toBe(1);
      expect(arr[4]).toBe(5);
    });

    test('should push to array', () => {
      const arr = [1, 2, 3];
      arr.push(4);
      expect(arr.length).toBe(4);
      expect(arr[3]).toBe(4);
    });
  });

  describe('Boolean Logic', () => {
    test('should evaluate true conditions', () => {
      expect(true).toBe(true);
      expect(1 === 1).toBe(true);
    });

    test('should evaluate false conditions', () => {
      expect(false).toBe(false);
      expect(1 as any === 2 as any).toBe(false);
    });
  });
});
