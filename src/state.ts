import * as fs from 'fs';
import * as path from 'path';
import { State, StateEntry } from './types';

const STATE_FILE = path.resolve(process.cwd(), 'garmin-calendar.state.json');

export function loadState(): State {
  if (!fs.existsSync(STATE_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  } catch {
    console.warn('State file corrotto, parto da zero.');
    return {};
  }
}

export function saveState(state: State): void {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

export function getEntry(state: State, garminId: string): StateEntry | undefined {
  return state[garminId];
}

export function setEntry(state: State, garminId: string, entry: StateEntry): void {
  state[garminId] = entry;
}

export function removeEntry(state: State, garminId: string): void {
  delete state[garminId];
}
