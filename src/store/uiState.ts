import type { AttendanceWeight } from '../api/haneulbit';
import type { WinnerType } from '../engine/RouletteEngineAdapter';
import { defaultSceneId } from '../maps/scenes';

export type UiState = {
  namesInput: string;
  winnerType: WinnerType;
  winnerRankInput: number;
  speed: number;
  autoRecording: boolean;
  useSkills: boolean;
  selectedSceneId: string;
  theme: string;
  mode: 'local' | 'api';
  apiBaseUrl: string;
  apiToken: string;
  apiStatus: string;
  apiRole: string;
  weights: AttendanceWeight[];
};

export type UiAction =
  | { type: 'setNamesInput'; value: string }
  | { type: 'setWinnerType'; value: WinnerType }
  | { type: 'setWinnerRankInput'; value: number }
  | { type: 'setSpeed'; value: number }
  | { type: 'setAutoRecording'; value: boolean }
  | { type: 'setUseSkills'; value: boolean }
  | { type: 'setSelectedSceneId'; value: string }
  | { type: 'setTheme'; value: string }
  | { type: 'setMode'; value: 'local' | 'api' }
  | { type: 'setApiBaseUrl'; value: string }
  | { type: 'setApiToken'; value: string }
  | { type: 'setApiStatus'; value: string }
  | { type: 'apiLoaded'; role: string; weights: AttendanceWeight[]; namesInput: string };

export function uiReducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case 'setNamesInput':
      return { ...state, namesInput: action.value };
    case 'setWinnerType':
      return { ...state, winnerType: action.value };
    case 'setWinnerRankInput':
      return { ...state, winnerRankInput: action.value };
    case 'setSpeed':
      return { ...state, speed: action.value };
    case 'setAutoRecording':
      return { ...state, autoRecording: action.value };
    case 'setUseSkills':
      return { ...state, useSkills: action.value };
    case 'setSelectedSceneId':
      return { ...state, selectedSceneId: action.value };
    case 'setTheme':
      return { ...state, theme: action.value };
    case 'setMode':
      return { ...state, mode: action.value };
    case 'setApiBaseUrl':
      return { ...state, apiBaseUrl: action.value };
    case 'setApiToken':
      return { ...state, apiToken: action.value };
    case 'setApiStatus':
      return { ...state, apiStatus: action.value };
    case 'apiLoaded':
      return {
        ...state,
        apiRole: action.role,
        weights: action.weights,
        namesInput: action.namesInput,
      };
    default:
      return state;
  }
}

export function createInitialUiState(apiBaseUrl: string): UiState {
  return {
    namesInput: '',
    winnerType: 'first',
    winnerRankInput: 1,
    speed: 1,
    autoRecording: true,
    useSkills: true,
    selectedSceneId: defaultSceneId,
    theme: 'dark',
    mode: 'local',
    apiBaseUrl,
    apiToken: '',
    apiStatus: 'idle',
    apiRole: '',
    weights: [],
  };
}
