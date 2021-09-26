
export interface Planet {
  name: string;
  moons: Moon[];
  position: number;
}

export interface Moon {
  id: number;
  name?: string;
}