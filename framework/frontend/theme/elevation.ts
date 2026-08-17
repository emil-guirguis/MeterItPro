/**
 * Material Design 3 Elevation System
 * Defines shadow specifications for elevation levels 0-5
 */

export const elevationShadows = {
  level0: 'none',
  level1: '0px 1px 3px rgba(0, 0, 0, 0.12), 0px 1px 2px rgba(0, 0, 0, 0.24)',
  level2: '0px 3px 6px rgba(0, 0, 0, 0.16), 0px 3px 6px rgba(0, 0, 0, 0.23)',
  level3: '0px 10px 20px rgba(0, 0, 0, 0.19), 0px 3px 6px rgba(0, 0, 0, 0.23)',
  level4: '0px 15px 25px rgba(0, 0, 0, 0.15), 0px 5px 10px rgba(0, 0, 0, 0.05)',
  level5: '0px 20px 40px rgba(0, 0, 0, 0.2)',
};

export interface ElevationSystem {
  level0: string;
  level1: string;
  level2: string;
  level3: string;
  level4: string;
  level5: string;
}

/**
 * Get elevation shadow by level
 */
export const getElevationShadow = (level: 0 | 1 | 2 | 3 | 4 | 5): string => {
  return elevationShadows[`level${level}` as keyof typeof elevationShadows];
};
