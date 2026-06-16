import type { FactorLevel } from '../types';

/**
 * band-specific band-specific factor levels.
 * Each band has 3 levels (1, 2, 3) per factor, representing
 * increasing depth/breadth of the factor.
 *
 * Factor abbreviations:
 *   FK = Functional Knowledge
 *   BE = Business Expertise
 *   LS = Leadership
 *   PS = Problem Solving
 *   NI = Nature of Impact
 *   AI = Area of Impact
 *   IS = Interpersonal Skills
 *
 * Level numbering (1 = lowest, 3 = highest):
 *   Level 1: Basic/in-depth understanding of own discipline
 *   Level 2: Broad understanding within own discipline + adjacent
 *   Level 3: Broad understanding across multiple disciplines
 *
 * Source: Willis Towers Watson Global Grading System documentation.
 */
export const DEFAULT_FACTOR_LEVELS: FactorLevel[] = [
  // ── Band 1 (Executive): C-suite, board-level ──
  // FK levels
  { id: 'FK1', bandId: 'band1', track: 'both', description: 'Broad understanding across multiple disciplines and industry ecosystems', minPoints: 40, maxPoints: 50 },
  { id: 'FK2', bandId: 'band1', track: 'both', description: 'Deep understanding of own discipline + adjacent disciplines', minPoints: 25, maxPoints: 39 },
  { id: 'FK3', bandId: 'band1', track: 'both', description: 'In-depth understanding of own discipline with basic knowledge of others', minPoints: 15, maxPoints: 24 },
  // BE levels
  { id: 'BE1', bandId: 'band1', track: 'both', description: 'Deep knowledge of how own function integrates within the business unit, and of direct competitors', minPoints: 40, maxPoints: 50 },
  { id: 'BE2', bandId: 'band1', track: 'both', description: 'In-depth understanding of how own sub-function integrates within the function and commercial awareness', minPoints: 25, maxPoints: 39 },
  { id: 'BE3', bandId: 'band1', track: 'both', description: 'In-depth understanding of how own area integrates within the sub-function and basic commercial awareness', minPoints: 15, maxPoints: 24 },
  // LS levels
  { id: 'LS1', bandId: 'band1', track: 'manager', description: 'Management responsibilities for multiple teams doing diverse activities (cross discipline)', minPoints: 40, maxPoints: 50 },
  { id: 'LS2', bandId: 'band1', track: 'manager', description: 'Management responsibility for multiple teams', minPoints: 25, maxPoints: 39 },
  { id: 'LS3', bandId: 'band1', track: 'manager', description: 'Management responsibilities for team of professionals (includes people, budget and planning)', minPoints: 15, maxPoints: 24 },
  // PS levels
  { id: 'PS1', bandId: 'band1', track: 'both', description: 'Requires complex judgement based on advanced analytical thought', minPoints: 40, maxPoints: 50 },
  { id: 'PS2', bandId: 'band1', track: 'both', description: 'Evaluates situations using multiple sources of information', minPoints: 25, maxPoints: 39 },
  { id: 'PS3', bandId: 'band1', track: 'both', description: 'Uses judgement based on the analysis of information', minPoints: 15, maxPoints: 24 },
  // NI levels
  { id: 'NI1', bandId: 'band1', track: 'both', description: 'Through contribution to strategic decisions', minPoints: 40, maxPoints: 50 },
  { id: 'NI2', bandId: 'band1', track: 'both', description: 'Through responsibility for planning, finances/budget, end results and setting policies', minPoints: 25, maxPoints: 39 },
  { id: 'NI3', bandId: 'band1', track: 'both', description: 'Through responsibility for delivery of end results, and contribution to planning, finances/budget and policy development', minPoints: 15, maxPoints: 24 },
  // AI levels
  { id: 'AI1', bandId: 'band1', track: 'both', description: 'Primarily on a function', minPoints: 40, maxPoints: 50 },
  { id: 'AI2', bandId: 'band1', track: 'both', description: 'Primarily on a sub-function', minPoints: 25, maxPoints: 39 },
  { id: 'AI3', bandId: 'band1', track: 'both', description: 'Primarily on an area', minPoints: 15, maxPoints: 24 },
  // IS levels
  { id: 'IS1', bandId: 'band1', track: 'both', description: 'Developed communication skills to negotiate internally and externally at high levels', minPoints: 40, maxPoints: 50 },
  { id: 'IS2', bandId: 'band1', track: 'both', description: 'Developed communication skills, ability to negotiate mainly internally and often at higher levels', minPoints: 25, maxPoints: 39 },
  { id: 'IS3', bandId: 'band1', track: 'both', description: 'Developed communication and diplomacy skills used to direct/persuade/influence others', minPoints: 15, maxPoints: 24 },

  // ── Band 2 (Middle Management): VPs, Directors ──
  // FK levels
  { id: 'FK1', bandId: 'band2', track: 'both', description: 'Broad and comprehensive understanding of concepts and principles in multiple disciplines', minPoints: 40, maxPoints: 50 },
  { id: 'FK2', bandId: 'band2', track: 'both', description: 'Broad and comprehensive understanding of concepts and principles within own discipline and knowledge of these elements in other disciplines', minPoints: 25, maxPoints: 39 },
  { id: 'FK3', bandId: 'band2', track: 'both', description: 'In-depth understanding of concepts and principles in own discipline and a basic knowledge of these elements in other disciplines', minPoints: 15, maxPoints: 24 },
  // BE levels
  { id: 'BE1', bandId: 'band2', track: 'both', description: 'In-depth knowledge of how own function integrates within the business unit, and of direct competitors (products/services)', minPoints: 40, maxPoints: 50 },
  { id: 'BE2', bandId: 'band2', track: 'both', description: 'In-depth understanding of how own sub-function integrates within the function and commercial awareness', minPoints: 25, maxPoints: 39 },
  { id: 'BE3', bandId: 'band2', track: 'both', description: 'In-depth understanding of how own area integrates within the sub-function and basic commercial awareness', minPoints: 15, maxPoints: 24 },
  // LS levels
  { id: 'LS1', bandId: 'band2', track: 'manager', description: 'Management responsibilities for multiple teams doing diverse activities (cross discipline)', minPoints: 40, maxPoints: 50 },
  { id: 'LS2', bandId: 'band2', track: 'manager', description: 'Management responsibility for multiple teams', minPoints: 25, maxPoints: 39 },
  { id: 'LS3', bandId: 'band2', track: 'manager', description: 'Management responsibilities for team of professionals (includes people, budget and planning)', minPoints: 15, maxPoints: 24 },
  // PS levels
  { id: 'PS1', bandId: 'band2', track: 'both', description: 'Requires complex judgement based on advanced analytical thought', minPoints: 40, maxPoints: 50 },
  { id: 'PS2', bandId: 'band2', track: 'both', description: 'Evaluates situations using multiple sources of information', minPoints: 25, maxPoints: 39 },
  { id: 'PS3', bandId: 'band2', track: 'both', description: 'Uses judgement based on the analysis of information', minPoints: 15, maxPoints: 24 },
  // NI levels
  { id: 'NI1', bandId: 'band2', track: 'both', description: 'Through contribution to strategic decisions', minPoints: 40, maxPoints: 50 },
  { id: 'NI2', bandId: 'band2', track: 'both', description: 'Through responsibility for planning, finances/budget, end results and setting policies', minPoints: 25, maxPoints: 39 },
  { id: 'NI3', bandId: 'band2', track: 'both', description: 'Through responsibility for delivery of end results, and contribution to planning, finances/budget and policy development', minPoints: 15, maxPoints: 24 },
  // AI levels
  { id: 'AI1', bandId: 'band2', track: 'both', description: 'Primarily on a function', minPoints: 40, maxPoints: 50 },
  { id: 'AI2', bandId: 'band2', track: 'both', description: 'Primarily on a sub-function', minPoints: 25, maxPoints: 39 },
  { id: 'AI3', bandId: 'band2', track: 'both', description: 'Primarily on an area', minPoints: 15, maxPoints: 24 },
  // IS levels
  { id: 'IS1', bandId: 'band2', track: 'both', description: 'Developed communication skills to negotiate internally and externally at high levels', minPoints: 40, maxPoints: 50 },
  { id: 'IS2', bandId: 'band2', track: 'both', description: 'Developed communication skills, ability to negotiate mainly internally and often at higher levels', minPoints: 25, maxPoints: 39 },
  { id: 'IS3', bandId: 'band2', track: 'both', description: 'Developed communication and diplomacy skills used to direct/persuade/influence others', minPoints: 15, maxPoints: 24 },

  // ── Band 3 (Operational): ICs, frontline managers ──
  // FK levels
  { id: 'FK1', bandId: 'band3', track: 'both', description: 'Broad and comprehensive understanding of concepts and principles in multiple disciplines', minPoints: 40, maxPoints: 50 },
  { id: 'FK2', bandId: 'band3', track: 'both', description: 'Broad and comprehensive understanding of concepts and principles within own discipline and knowledge of these elements in other disciplines', minPoints: 25, maxPoints: 39 },
  { id: 'FK3', bandId: 'band3', track: 'both', description: 'In-depth understanding of concepts and principles in own discipline and a basic knowledge of these elements in other disciplines', minPoints: 15, maxPoints: 24 },
  // BE levels
  { id: 'BE1', bandId: 'band3', track: 'both', description: 'In-depth knowledge of how own function integrates within the business unit, and of direct competitors (products/services)', minPoints: 40, maxPoints: 50 },
  { id: 'BE2', bandId: 'band3', track: 'both', description: 'In-depth understanding of how own sub-function integrates within the function and commercial awareness', minPoints: 25, maxPoints: 39 },
  { id: 'BE3', bandId: 'band3', track: 'both', description: 'In-depth understanding of how own area integrates within the sub-function and basic commercial awareness', minPoints: 15, maxPoints: 24 },
  // LS levels
  { id: 'LS1', bandId: 'band3', track: 'manager', description: 'Management responsibilities for multiple teams doing diverse activities (cross discipline)', minPoints: 40, maxPoints: 50 },
  { id: 'LS2', bandId: 'band3', track: 'manager', description: 'Management responsibility for multiple teams', minPoints: 25, maxPoints: 39 },
  { id: 'LS3', bandId: 'band3', track: 'manager', description: 'Management responsibilities for team of professionals (includes people, budget and planning)', minPoints: 15, maxPoints: 24 },
  // PS levels
  { id: 'PS1', bandId: 'band3', track: 'both', description: 'Requires complex judgement based on advanced analytical thought', minPoints: 40, maxPoints: 50 },
  { id: 'PS2', bandId: 'band3', track: 'both', description: 'Evaluates situations using multiple sources of information', minPoints: 25, maxPoints: 39 },
  { id: 'PS3', bandId: 'band3', track: 'both', description: 'Uses judgement based on the analysis of information', minPoints: 15, maxPoints: 24 },
  // NI levels
  { id: 'NI1', bandId: 'band3', track: 'both', description: 'Through contribution to strategic decisions', minPoints: 40, maxPoints: 50 },
  { id: 'NI2', bandId: 'band3', track: 'both', description: 'Through responsibility for planning, finances/budget, end results and setting policies', minPoints: 25, maxPoints: 39 },
  { id: 'NI3', bandId: 'band3', track: 'both', description: 'Through responsibility for delivery of end results, and contribution to planning, finances/budget and policy development', minPoints: 15, maxPoints: 24 },
  // AI levels
  { id: 'AI1', bandId: 'band3', track: 'both', description: 'Primarily on a function', minPoints: 40, maxPoints: 50 },
  { id: 'AI2', bandId: 'band3', track: 'both', description: 'Primarily on a sub-function', minPoints: 25, maxPoints: 39 },
  { id: 'AI3', bandId: 'band3', track: 'both', description: 'Primarily on an area', minPoints: 15, maxPoints: 24 },
  // IS levels
  { id: 'IS1', bandId: 'band3', track: 'both', description: 'Developed communication skills to negotiate internally and externally at high levels', minPoints: 40, maxPoints: 50 },
  { id: 'IS2', bandId: 'band3', track: 'both', description: 'Developed communication skills, ability to negotiate mainly internally and often at higher levels', minPoints: 25, maxPoints: 39 },
  { id: 'IS3', bandId: 'band3', track: 'both', description: 'Developed communication and diplomacy skills used to direct/persuade/influence others', minPoints: 15, maxPoints: 24 },
];
