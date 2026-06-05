import { useReducer, useEffect, useRef } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";

const initialState = {
  vouchers: [],
  loading: true,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_VOUCHERS":
      return { ...state, vouchers: action.payload, loading: false };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

// All authenticated staff can see all vouchers
export function useVouchers(uid) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const unsubRef = useRef(null);

  useEffect(() => {
    if (!uid) {
      dispatch({ type: "SET_VOUCHERS", payload: [] });
      return;
    }

    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    dispatch({ type: "SET_LOADING", payload: true });

    const q = query(collection(db, "vouchers"), orderBy("createdAt", "desc"));

    unsubRef.current = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        dispatch({ type: "SET_VOUCHERS", payload: data });
      },
      (err) => {
        dispatch({ type: "SET_ERROR", payload: err.message });
      }
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

export async function createVoucher(data) {
  return addDoc(collection(db, "vouchers"), {
    ...data,
    isRedeemed: false,
    redeemedBy: null,
    redeemedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateVoucher(id, data) {
  return updateDoc(doc(db, "vouchers", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteVoucher(id) {
  return deleteDoc(doc(db, "vouchers", id));
}

// Redeem by voucher code — staff inputs code, finds voucher, marks as redeemed
export async function redeemVoucherByCode(code, staffUid, staffName) {
  // Query voucher by code
  const q = query(
    collection(db, "vouchers"),
    where("code", "==", code.trim().toUpperCase())
  );

  const snap = await getDocs(q);

  if (snap.empty) throw new Error("Kode voucher tidak ditemukan");

  const voucherDoc = snap.docs[0];
  const voucher = voucherDoc.data();

  if (!voucher.isActive) throw new Error("Voucher tidak aktif");
  if (voucher.isRedeemed) throw new Error("Voucher sudah pernah digunakan");

  const expiresAt = voucher.expiresAt
    ? (voucher.expiresAt.toDate ? voucher.expiresAt.toDate() : new Date(voucher.expiresAt))
    : null;
  if (expiresAt && expiresAt < new Date()) throw new Error("Voucher sudah kadaluarsa");

  await updateDoc(doc(db, "vouchers", voucherDoc.id), {
    isRedeemed: true,
    redeemedBy: staffUid,
    redeemedByName: staffName,
    redeemedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await addDoc(collection(db, "redemptions"), {
    voucherId: voucherDoc.id,
    voucherCode: voucher.code,
    voucherTitle: voucher.title,
    discount: voucher.discount,
    discountType: voucher.discountType,
    customerName: voucher.customerName || null,
    customerPhone: voucher.customerPhone || null,
    staffUid,
    staffName,
    redeemedAt: serverTimestamp(),
  });

  return { id: voucherDoc.id, ...voucher };
}

// Direct redeem by voucher ID (from card button)
export async function redeemVoucherById(voucherId, staffUid, staffName) {
  const ref = doc(db, "vouchers", voucherId);
  const snap = await getDoc(ref);

  if (!snap.exists()) throw new Error("Voucher tidak ditemukan");
  const voucher = snap.data();

  if (!voucher.isActive) throw new Error("Voucher tidak aktif");
  if (voucher.isRedeemed) throw new Error("Voucher sudah pernah digunakan");

  const expiresAt = voucher.expiresAt
    ? (voucher.expiresAt.toDate ? voucher.expiresAt.toDate() : new Date(voucher.expiresAt))
    : null;
  if (expiresAt && expiresAt < new Date()) throw new Error("Voucher sudah kadaluarsa");

  await updateDoc(ref, {
    isRedeemed: true,
    redeemedBy: staffUid,
    redeemedByName: staffName,
    redeemedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await addDoc(collection(db, "redemptions"), {
    voucherId,
    voucherCode: voucher.code,
    voucherTitle: voucher.title,
    discount: voucher.discount,
    discountType: voucher.discountType,
    customerName: voucher.customerName || null,
    customerPhone: voucher.customerPhone || null,
    staffUid,
    staffName,
    redeemedAt: serverTimestamp(),
  });

  return { id: voucherId, ...voucher };
}
