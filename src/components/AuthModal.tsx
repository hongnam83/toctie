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
  const [accountName, setAccountName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quickAction, setQuickAction] = useState<"canRegister" | "canLogin" | null>(null);

  const handleSubmit = async (e: React.FormEvent, forceAction?: Tab) => {
    if (e) e.preventDefault();
    setError("");
    setQuickAction(null);

    const trimmed = accountName.trim();
    if (!trimmed) {
      setError("Vui lòng nhập tên tài khoản của bạn.");
      return;
    }
    if (trimmed.length < 2) {
      setError("Tên tài khoản phải có ít nhất 2 ký tự.");
      return;
    }
    if (trimmed.length > 50) {
      setError("Tên tài khoản tối đa 50 ký tự.");
      return;
    }

    const action = forceAction || tab;
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountName: trimmed, action }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.notFound) {
          setError(`Chưa tìm thấy tài khoản "${trimmed}".`);
          setQuickAction("canRegister");
        } else if (data.exists) {
          setError(`Tài khoản "${trimmed}" đã có người đăng ký.`);
          setQuickAction("canLogin");
        } else {
          setError(data.error || "Đã có lỗi xảy ra. Vui lòng thử lại.");
        }
        return;
      }

      onSuccess(data.user as UserSession);
    } catch {
      setError("Không thể kết nối server. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRegister = () => {
    setTab("register");
    handleSubmit(null as unknown as React.FormEvent, "register");
  };

  const handleQuickLogin = () => {
    setTab("login");
    handleSubmit(null as unknown as React.FormEvent, "login");
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={tab === "login" ? "Đăng nhập bằng tài khoản riêng" : "Tạo tài khoản riêng mới"}
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
            {tab === "login" ? "Đăng nhập tài khoản" : "Tạo tài khoản riêng"}
          </h2>
          <p className={styles.subtitle}>
            {tab === "login"
              ? "Nhập tên tài khoản của bạn để tiếp tục gom 4 mảnh ghép"
              : "Tự đặt một tên tài khoản riêng để lưu giữ các mảnh ghép dự thưởng"}
          </p>
        </div>

        {/* Tabs */}
        <div className={styles.tabs} role="tablist">
          <button
            role="tab"
            aria-selected={tab === "login"}
            className={`${styles.tab} ${tab === "login" ? styles.tabActive : ""}`}
            onClick={() => {
              setTab("login");
              setError("");
              setQuickAction(null);
            }}
            type="button"
          >
            Đăng nhập
          </button>
          <button
            role="tab"
            aria-selected={tab === "register"}
            className={`${styles.tab} ${tab === "register" ? styles.tabActive : ""}`}
            onClick={() => {
              setTab("register");
              setError("");
              setQuickAction(null);
            }}
            type="button"
          >
            Tạo tài khoản mới
          </button>
        </div>

        {/* Form */}
        <form className={styles.form} onSubmit={(e) => handleSubmit(e)} noValidate>
          <div className="input-group">
            <label className="input-label" htmlFor="auth-account-name">
              {tab === "login" ? "Tên tài khoản của bạn" : "Tên tài khoản riêng bạn muốn đặt"}
            </label>
            <input
              id="auth-account-name"
              type="text"
              className={`input-field ${error && !accountName.trim() ? "error" : ""}`}
              placeholder={
                tab === "login"
                  ? "Nhập tên tài khoản bạn đã tạo..."
                  : "Ví dụ: maianh2010, thuy_tien, 0912345678..."
              }
              value={accountName}
              onChange={(e) => {
                setAccountName(e.target.value);
                setError("");
                setQuickAction(null);
              }}
              autoFocus
              maxLength={50}
            />
          </div>

          {/* Friendly Note */}
          <div className={styles.inputNote}>
            <span className={styles.inputNoteIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </span>
            <div>
              {tab === "login" ? (
                <>
                  <strong>Đăng nhập không cần mật khẩu:</strong> Bạn chỉ cần nhập đúng tên tài khoản riêng đã tạo để tiếp tục gom mảnh ghép.
                </>
              ) : (
                <>
                  <strong>Lưu ý:</strong> Bạn có thể dùng tên riêng, nickname hoặc số điện thoại. Hãy nhớ tên này để vào lại lần sau nhé!
                </>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="message message-error" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Quick Action Prompt */}
          {quickAction === "canRegister" && (
            <div className={styles.quickActionBox}>
              <span>Bạn có muốn tạo tài khoản mới với tên <strong>"{accountName.trim()}"</strong> ngay không?</span>
              <button
                type="button"
                className={styles.quickActionBtn}
                onClick={handleQuickRegister}
                disabled={loading}
              >
                Tạo mới tài khoản "{accountName.trim()}" ➔
              </button>
            </div>
          )}

          {quickAction === "canLogin" && (
            <div className={styles.quickActionBox}>
              <span>Đây có phải tài khoản của bạn không? Bạn có thể đăng nhập ngay:</span>
              <button
                type="button"
                className={styles.quickActionBtn}
                onClick={handleQuickLogin}
                disabled={loading}
              >
                Đăng nhập vào "{accountName.trim()}" ➔
              </button>
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
                {tab === "login" ? "Vào ghép tranh" : "Tạo tài khoản & Bắt đầu"}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </>
            )}
          </button>

          <p className={styles.switchNote}>
            {tab === "login" ? (
              <>
                Chưa có tài khoản riêng?{" "}
                <button
                  type="button"
                  className={styles.switchLink}
                  onClick={() => {
                    setTab("register");
                    setError("");
                    setQuickAction(null);
                  }}
                >
                  Tạo tài khoản mới
                </button>
              </>
            ) : (
              <>
                Đã có tài khoản trước đó?{" "}
                <button
                  type="button"
                  className={styles.switchLink}
                  onClick={() => {
                    setTab("login");
                    setError("");
                    setQuickAction(null);
                  }}
                >
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
