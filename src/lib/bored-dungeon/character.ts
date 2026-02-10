import type { MetaUpgrades, RunState } from './types';

export interface StartingCharacter {
  hp: number;
  maxHp: number;
  attack: number;
  guard: number;
  luck: number;
  gold: number;
}

export function createStartingCharacter(upgrades: MetaUpgrades): StartingCharacter {
  return {
    hp: 28 + upgrades.vigor * 5,
    maxHp: 28 + upgrades.vigor * 5,
    attack: 4 + upgrades.might,
    guard: 1 + Math.floor(upgrades.vigor / 2),
    luck: 1 + upgrades.instinct,
    gold: 3 + upgrades.instinct * 2,
  };
}

export function applyIncomingDamage(run: RunState, rawDamage: number): number {
  if (run.flags.smokeShield > 0) {
    run.flags.smokeShield -= 1;
    return 0;
  }

  const reduction = run.guard + run.flags.damageReduction;
  const debuffPenalty = run.debuffs.rattled ? 1 : 0;
  const damage = Math.max(0, rawDamage - reduction);
  const totalDamage = damage + debuffPenalty;
  run.hp -= totalDamage;
  return totalDamage;
}
