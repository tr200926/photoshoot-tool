import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateToken } from '../../src/middleware/auth';

describe('Authentication', () => {
  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken('user-123', 'workspace-456', 'admin');
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should contain correct payload', () => {
      const token = generateToken('user-123', 'workspace-456', 'editor');
      const decoded = jwt.decode(token) as any;
      expect(decoded.userId).toBe('user-123');
      expect(decoded.workspaceId).toBe('workspace-456');
      expect(decoded.role).toBe('editor');
    });

    it('should expire in 7 days', () => {
      const token = generateToken('user-123', 'workspace-456', 'admin');
      const decoded = jwt.decode(token) as any;
      const now = Math.floor(Date.now() / 1000);
      const sevenDays = 7 * 24 * 60 * 60;
      expect(decoded.exp - decoded.iat).toBeCloseTo(sevenDays, -1);
    });
  });

  describe('Password hashing', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const hash = await bcrypt.hash(password, 10);
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should verify correct password', async () => {
      const password = 'testPassword123';
      const hash = await bcrypt.hash(password, 10);
      const isMatch = await bcrypt.compare(password, hash);
      expect(isMatch).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testPassword123';
      const hash = await bcrypt.hash(password, 10);
      const isMatch = await bcrypt.compare('wrongPassword', hash);
      expect(isMatch).toBe(false);
    });
  });
});
