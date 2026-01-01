// __tests__/utils/dashboardUtils.test.js
import { getTodaySlotsCount, validateProfessionalExists } from '../../utils/dashboardUtils';

describe('dashboardUtils', () => {
  describe('getTodaySlotsCount', () => {
    it('should return 0 when no slots', () => {
      const result = getTodaySlotsCount({});
      expect(result).toBe(0);
    });

    it('should count only today slots', () => {
      const mockSlots = {
        'pro1': [
          { time: new Date().toISOString() },
          { time: new Date(Date.now() - 86400000).toISOString() } // yesterday
        ]
      };
      const result = getTodaySlotsCount(mockSlots);
      expect(result).toBe(1);
    });
  });

  describe('validateProfessionalExists', () => {
    const mockProfessionals = [
      { id: '1', name: 'Prof 1' },
      { id: '2', name: 'Prof 2' }
    ];

    it('should return true for existing professional', () => {
      expect(validateProfessionalExists(mockProfessionals, '1')).toBe(true);
    });

    it('should return false for non-existing professional', () => {
      expect(validateProfessionalExists(mockProfessionals, '3')).toBe(false);
    });

    it('should return true for "all"', () => {
      expect(validateProfessionalExists(mockProfessionals, 'all')).toBe(true);
    });
  });
});
