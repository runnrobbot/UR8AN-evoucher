import { useReducer, useEffect, useRef } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../lib/firebase";

const initialState = { redemptions: [], loading: true, error: null };

function reducer(state, action) {
  switch (action.type) {
    case "SET":
      return { ...state, redemptions: action.payload, loading: false };
    case "ERROR":
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}

// All staff can see all redemptions
export function useRedemptions(uid) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const unsubRef = useRef(null);

  useEffect(() => {
    if (!uid) {
      dispatch({ type: "SET", payload: [] });
      return;
    }

    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    const q = query(
      collection(db, "redemptions"),
      orderBy("redeemedAt", "desc")
    );

    unsubRef.current = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        dispatch({ type: "SET", payload: data });
      },
      (err) => dispatch({ type: "ERROR", payload: err.message })
    );

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [uid]);

  return state;
}
