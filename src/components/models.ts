export interface Todo {
  id: number;
  content: string;
}

export interface Meta {
  totalCount: number;
}

export interface Observation {
  date: string;
  height?: number;
  leafCondition: string;
}

export interface Pepper {
  id: string;
  name: string;
  variety: string;
  photoUrl: string;
  description: string;
  stage: 'проращивание' | 'рассада' | 'вегетация' | 'плодоношение' | 'сбор урожая';
  stageHistory?: { date: string; stage: Pepper['stage'] }[];
  plantingDate: string;
  fertilizingHistory: {
    date: string;
    note?: string;
    grams?: number;
    composition?: FertilizerComposition;
  }[];
  wateringHistory: { date: string; volume?: number }[];
  location: {
    type: 'грунт' | 'теплица' | 'огород' | 'горшок' | 'кассета для проращивания';
    potVolume?: string;
  };
  locationHistory?: { date: string; type: Pepper['location']['type']; potVolume?: string }[];
  treatmentHistory?: { date: string; agent: string; volume?: number }[];
  isFavorite?: boolean;
  observationLog?: Observation[];
  soilExtras?: {
    hasDrainage: boolean;
    drainage: string | null;
    hasSoilImprovement: boolean;
    soilImprovement: string | null;
  };
}

export interface FertilizerComposition {
  N?: number;
  P?: number;
  K?: number;
  CaO?: number;
  MgO?: number;
  [key: string]: number | undefined;
}

export interface WateringEntry {
  date: string;
  volume?: number;
}
export interface FertilizingEntry {
  date: string;
  note?: string;
  grams?: number;
  composition?: FertilizerComposition;
}
export interface TreatmentEntry {
  date: string;
  agent: string;
  volume?: number;
}
