"use client";

import { useState } from "react";
import styles from "./AuthModal.module.css";
import TocTieLogo from "@/components/TocTieLogo";
import type { UserSession } from "@/app/page";

interface Props {
  onClose: () => void;
  onSuccess: (user: UserSession) => void;
}

type Tab = "login" | "register";

export default function AuthModal({ onClose, onSuccess }: Props) {
  const [tab, setTab] = useState<Tab>("login");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Vui lòng nhập họ và tên của bạn.");
      return;
    }
    if (fullName.trim().length < 2) {
      setError("Họ và tên phải có ít nhất 2 ký tự.");
      return;
    }
    if (!password) {
      setError("Vui lòng nhập mật khẩu.");
      return;
    }
    if (password.length < 4) {
      setError("Mật khẩu phải có ít nhất 4 ký tự.");
      return;
    }
    if (tab === "register" && password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: fullName.trim(), password, action: tab }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Đã có lỗi xảy ra. Vui lòng thử lại.");
        return;
      }

      onSuccess(data.user as UserSession);
    } catch {
      setError("Không thể kết nối server. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={tab === "login" ? "Đăng nhập" : "Đăng ký"}
      onClick={handleOverlayClick}
    >
      <div className={styles.modal}>
        {/* Close button */}
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Đóng"
          type="button"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header */}
        <div className={styles.header}>
          <TocTieLogo size={64} />
          <h2 className={styles.title}>
            {tab === "login" ? "Chào mừng trở lại!" : "Tham gia ngay!"}
          </h2>
          <p className={styles.subtitle}>
            {tab === "login"
              ? "Đăng nhập để xem bộ sưu tập mảnh ghép của bạn"
              : "Đăng ký để bắt đầu hành trình thu thập mảnh ghép"}
          </p>
        </div>

        {/* Tabs */}
        <div className={styles.tabs} role="tablist">
          <button
            role="tab"
            aria-selected={tab === "login"}
            className={`${styles.tab} ${tab === "login" ? styles.tabActive : ""}`}
            onClick={() => { setTab("login"); setError(""); }}
            type="button"
          >
            Đăng nhập
          </button>
          <button
            role="tab"
            aria-selected={tab === "register"}
            className={`${styles.tab} ${tab === "register" ? styles.tabActive : ""}`}
            onClick={() => { setTab("register"); setError(""); }}
            type="button"
          >
            Đăng ký mới
          </button>
        </div>

        {/* Form */}
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className="input-group">
            <label className="input-label" htmlFor="auth-name">
              Họ và tên
            </label>
            <input
              id="auth-name"
              type="text"
              className={`input-field ${error && !fullName.trim() ? "error" : ""}`}
              placeholder="Nhập họ và tên của bạn..."
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); setError(""); }}
              autoComplete="name"
              autoFocus
              maxLength={60}
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="auth-password">
              Mật khẩu
            </label>
            <input
              id="auth-password"
              type="password"
              className={`input-field ${error && !password ? "error" : ""}`}
              placeholder={tab === "register" ? "Tạo mật khẩu (ít nhất 4 ký tự)..." : "Nhập mật khẩu..."}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              autoComplete={tab === "register" ? "new-password" : "current-password"}
              maxLength={100}
            />
          </div>

          {tab === "register" && (
            <div className="input-group">
              <label className="input-label" htmlFor="auth-confirm">
                Xác nhận mật khẩu
              </label>
              <input
                id="auth-confirm"
                type="password"
                className={`input-field ${error && password !== confirmPassword ? "error" : ""}`}
                placeholder="Nhập lại mật khẩu..."
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                autoComplete="new-password"
                maxLength={100}
              />
            </div>
          )}

          {error && (
            <div className="message message-error" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            className={`btn btn-primary w-full ${styles.submitBtn}`}
            disabled={loading}
            id={`auth-submit-${tab}`}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Đang xử lý...
              </>
            ) : (
              <>
                {tab === "login" ? "Đăng nhập" : "Tạo tài khoản"}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </>
            )}
          </button>

          <p className={styles.switchNote}>
            {tab === "login" ? (
              <>
                Chưa có tài khoản?{" "}
                <button type="button" className={styles.switchLink} onClick={() => { setTab("register"); setError(""); }}>
                  Đăng ký ngay
                </button>
              </>
            ) : (
              <>
                Đã có tài khoản?{" "}
                <button type="button" className={styles.switchLink} onClick={() => { setTab("login"); setError(""); }}>
                  Đăng nhập
                </button>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
