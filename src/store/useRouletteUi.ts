import { useMemo, useReducer } from 'react';
import { loadAttendanceWeights } from '../api/haneulbit';
import { createInitialUiState, uiReducer } from './uiState';

export function useRouletteUi() {
  const [state, dispatch] = useReducer(
    uiReducer,
    createInitialUiState(
      (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'https://haneulbit-api.holyimpact.org'
    )
  );

  const names = useMemo(
    () =>
      state.namesInput
        .split(/[\n,]/g)
        .map((v) => v.trim())
        .filter(Boolean),
    [state.namesInput]
  );

  const winnerRank = useMemo(() => {
    if (state.winnerType === 'first') return 1;
    if (state.winnerType === 'last') return Math.max(1, names.length);
    return Math.max(1, state.winnerRankInput);
  }, [state.winnerRankInput, state.winnerType, names.length]);

  const shuffleNames = () => {
    const shuffled = [...names].sort(() => Math.random() - 0.5);
    dispatch({ type: 'setNamesInput', value: shuffled.join('\n') });
  };

  const loadFromAttendanceApi = async () => {
    try {
      dispatch({ type: 'setApiStatus', value: 'loading...' });
      const { me, weights } = await loadAttendanceWeights(state.apiBaseUrl, state.apiToken.trim());
      const weightedNames = weights.map((w) => `${w.name}*${Math.max(1, w.count)}`);
      dispatch({
        type: 'apiLoaded',
        role: me.role || 'unknown',
        weights,
        namesInput: weightedNames.join('\n'),
      });
      dispatch({ type: 'setApiStatus', value: `loaded ${weights.length} users (approved attendance based weights)` });
    } catch (err) {
      dispatch({ type: 'setApiStatus', value: `failed: ${err instanceof Error ? err.message : String(err)}` });
    }
  };

  return {
    state,
    dispatch,
    names,
    winnerRank,
    shuffleNames,
    loadFromAttendanceApi,
  };
}
