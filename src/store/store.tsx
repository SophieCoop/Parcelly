import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import {
  SEED_ADDRESSES,
  SEED_NOTIFICATIONS,
  SEED_PARCELS,
  SEED_SETTINGS,
  SEED_SOURCES,
} from '../data/seed';
import { buildParcel, uid, type ParcelDraft } from '../lib/factory';
import type {
  Address,
  AppNotification,
  ConnectedSource,
  Parcel,
  PickupPoint,
  Settings,
} from '../types';

const STORAGE_KEY = 'parcelly.state.v1';

export interface AppState {
  parcels: Parcel[];
  notifications: AppNotification[];
  addresses: Address[];
  sources: ConnectedSource[];
  settings: Settings;
  onboarded: boolean;
}

function initialState(): AppState {
  return {
    parcels: SEED_PARCELS,
    notifications: SEED_NOTIFICATIONS,
    addresses: SEED_ADDRESSES,
    sources: SEED_SOURCES,
    settings: SEED_SETTINGS,
    onboarded: false,
  };
}

type Action =
  | { type: 'hydrate'; state: AppState }
  | { type: 'addParcel'; parcel: Parcel }
  | { type: 'updateParcel'; id: string; patch: Partial<Parcel> }
  | { type: 'removeParcel'; id: string }
  | { type: 'addNotification'; notification: AppNotification }
  | { type: 'readNotification'; id: string }
  | { type: 'readAllNotifications' }
  | { type: 'saveAddress'; address: Address }
  | { type: 'removeAddress'; id: string }
  | { type: 'toggleSource'; id: string }
  | { type: 'updateSettings'; patch: Partial<Settings> }
  | { type: 'setOnboarded'; value: boolean }
  | { type: 'reset' };

function touch(parcel: Parcel, patch: Partial<Parcel>): Parcel {
  return { ...parcel, ...patch, updatedAt: new Date().toISOString() };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'hydrate':
      return action.state;
    case 'addParcel':
      return { ...state, parcels: [action.parcel, ...state.parcels] };
    case 'updateParcel':
      return {
        ...state,
        parcels: state.parcels.map((parcel) =>
          parcel.id === action.id ? touch(parcel, action.patch) : parcel,
        ),
      };
    case 'removeParcel':
      return { ...state, parcels: state.parcels.filter((parcel) => parcel.id !== action.id) };
    case 'addNotification':
      return { ...state, notifications: [action.notification, ...state.notifications] };
    case 'readNotification':
      return {
        ...state,
        notifications: state.notifications.map((item) =>
          item.id === action.id ? { ...item, read: true } : item,
        ),
      };
    case 'readAllNotifications':
      return {
        ...state,
        notifications: state.notifications.map((item) => ({ ...item, read: true })),
      };
    case 'saveAddress': {
      const exists = state.addresses.some((address) => address.id === action.address.id);
      const addresses = exists
        ? state.addresses.map((address) =>
            address.id === action.address.id ? action.address : address,
          )
        : [...state.addresses, action.address];
      return {
        ...state,
        addresses: action.address.isDefault
          ? addresses.map((address) => ({
              ...address,
              isDefault: address.id === action.address.id,
            }))
          : addresses,
      };
    }
    case 'removeAddress':
      return { ...state, addresses: state.addresses.filter((a) => a.id !== action.id) };
    case 'toggleSource':
      return {
        ...state,
        sources: state.sources.map((source) =>
          source.id === action.id
            ? {
                ...source,
                connected: !source.connected,
                lastSync: !source.connected ? new Date().toISOString() : source.lastSync,
              }
            : source,
        ),
      };
    case 'updateSettings':
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case 'setOnboarded':
      return { ...state, onboarded: action.value };
    case 'reset':
      return { ...initialState(), onboarded: true };
    default:
      return state;
  }
}

function load(): AppState | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (!Array.isArray(parsed.parcels)) return undefined;
    return { ...initialState(), ...parsed } as AppState;
  } catch {
    return undefined;
  }
}

interface StoreValue extends AppState {
  addParcel: (draft: ParcelDraft) => Parcel;
  updateParcel: (id: string, patch: Partial<Parcel>) => void;
  removeParcel: (id: string) => void;
  archiveParcel: (id: string) => void;
  markCollected: (id: string) => void;
  resolveAction: (id: string) => void;
  setPickupPoint: (id: string, point: PickupPoint) => void;
  setDeliveryAddress: (id: string, address: Address) => void;
  notify: (notification: Omit<AppNotification, 'id' | 'date'>) => void;
  readNotification: (id: string) => void;
  readAllNotifications: () => void;
  saveAddress: (address: Address) => void;
  removeAddress: (id: string) => void;
  toggleSource: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setOnboarded: (value: boolean) => void;
  reset: () => void;
  getParcel: (id: string) => Parcel | undefined;
  unreadCount: number;
}

const StoreContext = createContext<StoreValue | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => load() ?? initialState());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or blocked (private mode) – the app still works in memory.
    }
  }, [state]);

  const addParcel = useCallback((draft: ParcelDraft) => {
    const parcel = buildParcel(draft);
    dispatch({ type: 'addParcel', parcel });
    return parcel;
  }, []);

  const notify = useCallback((notification: Omit<AppNotification, 'id' | 'date'>) => {
    dispatch({
      type: 'addNotification',
      notification: { ...notification, id: uid('nt'), date: new Date().toISOString() },
    });
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      ...state,
      addParcel,
      notify,
      updateParcel: (id, patch) => dispatch({ type: 'updateParcel', id, patch }),
      removeParcel: (id) => dispatch({ type: 'removeParcel', id }),
      archiveParcel: (id) => dispatch({ type: 'updateParcel', id, patch: { archived: true } }),
      markCollected: (id) =>
        dispatch({
          type: 'updateParcel',
          id,
          patch: { collected: true, status: 'delivered', readyForPickup: false },
        }),
      resolveAction: (id) => {
        const parcel = state.parcels.find((item) => item.id === id);
        if (!parcel?.action) return;
        dispatch({
          type: 'updateParcel',
          id,
          patch: { action: { ...parcel.action, resolvedAt: new Date().toISOString() } },
        });
      },
      setPickupPoint: (id, point) => {
        const parcel = state.parcels.find((item) => item.id === id);
        if (!parcel) return;
        dispatch({
          type: 'updateParcel',
          id,
          patch: {
            delivery: { ...parcel.delivery, method: 'pickup', pickupPoint: point },
            action: parcel.action?.type === 'choose_pickup'
              ? { ...parcel.action, resolvedAt: new Date().toISOString() }
              : parcel.action,
          },
        });
      },
      setDeliveryAddress: (id, address) => {
        const parcel = state.parcels.find((item) => item.id === id);
        if (!parcel) return;
        dispatch({
          type: 'updateParcel',
          id,
          patch: {
            delivery: { ...parcel.delivery, method: 'home', address, pickupPoint: undefined },
            action: parcel.action?.type === 'address_missing'
              ? { ...parcel.action, resolvedAt: new Date().toISOString() }
              : parcel.action,
          },
        });
      },
      readNotification: (id) => dispatch({ type: 'readNotification', id }),
      readAllNotifications: () => dispatch({ type: 'readAllNotifications' }),
      saveAddress: (address) => dispatch({ type: 'saveAddress', address }),
      removeAddress: (id) => dispatch({ type: 'removeAddress', id }),
      toggleSource: (id) => dispatch({ type: 'toggleSource', id }),
      updateSettings: (patch) => dispatch({ type: 'updateSettings', patch }),
      setOnboarded: (value) => dispatch({ type: 'setOnboarded', value }),
      reset: () => dispatch({ type: 'reset' }),
      getParcel: (id) => state.parcels.find((parcel) => parcel.id === id),
      unreadCount: state.notifications.filter((item) => !item.read).length,
    }),
    [state, addParcel, notify],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used inside <StoreProvider>');
  return context;
}
