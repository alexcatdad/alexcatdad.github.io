import { encounterFlavors, entityCatalog, locationCatalog } from './catalog';
import type { EntityKey, LocationKey, RoomType } from './types';

export function getEntityLabel(entityKey: EntityKey): string {
  return entityCatalog[entityKey].label;
}

export function getLocationLabel(locationKey: LocationKey): string {
  return locationCatalog[locationKey].label;
}

export function getEncounterFlavors(encounterType: RoomType): string[] {
  return encounterFlavors[encounterType];
}
