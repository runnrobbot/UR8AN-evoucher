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
  increment,
} from "firebase/firestore";
import { db } from "../lib/firebase";

// ── Voucher status helper (single source of truth) ───────────────────────────
export function getVoucherStatus(v) {
  const isExpired = v.expiresAt
    ? (v.expiresAt.toDate ? v.expiresAt.toDate() : new Date(v.expiresAt)) < new Date()
    : false;
  const usageCount = v.usageCount ?? 0;
  const usageLimit = v.usageLimit ?? null;
  const isFull     = usageLimit !== null && usageCount >= usageLimit;

  if (!v.isActive)  return "inactive";
  if (isExpired)    return "expired";
  if (isFull)       return "full";     // usage limit tercapai
  return "active";
}

export function isVoucherUsable(v) {
  return getVoucherStatus(v) === "active";
}

// ── Hook ─────────────────────────────────────────────────────────────────────
const initialState = { vouchers: [], loading: true, error: null };

function reducer(state, action) {
  switch (action.type) {
    case "SET_VOUCHERS": return { ...state, vouchers: action.payload, loading: false };
    case "SET_ERROR":    return { ...state, error: action.payload,    loading: false };
    case "SET_LOADING":  return { ...state, loading: action.payload };
    default:             return state;
  }
}

export function useVouchers(uid) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const unsubRef = useRef(null);

  useEffect(() => {
    if (!uid) { dispatch({ type: "SET_VOUCHERS", payload: [] }); return; }

    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    dispatch({ type: "SET_LOADING", payload: true });

    const q = query(collection(db, "vouchers"), orderBy("createdAt", "desc"));
    unsubRef.current = onSnapshot(
      q,
      (snap) => dispatch({ type: "SET_VOUCHERS", payload: snap.docs.map((d) => ({ id: d.id, ...d.data() })) }),
      (err)  => dispatch({ type: "SET_ERROR",    payload: err.message })
    );

    return () => { if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; } };
  }, [uid]);

  return state;
}

// ── CRUD ─────────────────────────────────────────────────────────────────────
export async function createVoucher(data) {
  return addDoc(collection(db, "vouchers"), {
    ...data,
    usageCount: 0,
    createdAt:  serverTimestamp(),
    updatedAt:  serverTimestamp(),
  });
}

export async function updateVoucher(id, data) {
  return updateDoc(doc(db, "vouchers", id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteVoucher(id) {
  return deleteDoc(doc(db, "vouchers", id));
}

// ── Redeem helpers ────────────────────────────────────────────────────────────
function validateVoucher(voucher) {
  if (!voucher.isActive) throw new Error("Voucher tidak aktif");

  const expiresAt = voucher.expiresAt
    ? (voucher.expiresAt.toDate ? voucher.expiresAt.toDate() : new Date(voucher.expiresAt))
    : null;
  if (expiresAt && expiresAt < new Date()) throw new Error("Voucher sudah kadaluarsa");

  const usageCount = voucher.usageCount ?? 0;
  const usageLimit = voucher.usageLimit ?? null;
  if (usageLimit !== null && usageCount >= usageLimit) throw new Error("Batas penggunaan voucher telah tercapai");
}

async function writeRedeem(voucherDocId, voucher, staffUid, staffName) {
  // Increment usage count
  await updateDoc(doc(db, "vouchers", voucherDocId), {
    usageCount:      increment(1),
    lastRedeemedBy:  staffUid,
    lastRedeemedName: staffName,
    lastRedeemedAt:  serverTimestamp(),
    updatedAt:       serverTimestamp(),
  });

  await addDoc(collection(db, "redemptions"), {
    voucherId:    voucherDocId,
    voucherCode:  voucher.code,
    voucherTitle: voucher.title,
    discount:     voucher.discount,
    discountType: voucher.discountType,
    customerName: voucher.customerName  || null,
    customerPhone: voucher.customerPhone || null,
    staffUid,
    staffName,
    redeemedAt:   serverTimestamp(),
  });
}

export async function redeemVoucherByCode(code, staffUid, staffName) {
  const snap = await getDocs(
    query(collection(db, "vouchers"), where("code", "==", code.trim().toUpperCase()))
  );
  if (snap.empty) throw new Error("Kode voucher tidak ditemukan");

  const voucherDoc = snap.docs[0];
  const voucher    = voucherDoc.data();
  validateVoucher(voucher);
  await writeRedeem(voucherDoc.id, voucher, staffUid, staffName);
  return { id: voucherDoc.id, ...voucher };
}

export async function redeemVoucherById(voucherId, staffUid, staffName) {
  const snap = await getDoc(doc(db, "vouchers", voucherId));
  if (!snap.exists()) throw new Error("Voucher tidak ditemukan");
  const voucher = snap.data();
  validateVoucher(voucher);
  await writeRedeem(voucherId, voucher, staffUid, staffName);
  return { id: voucherId, ...voucher };
}
