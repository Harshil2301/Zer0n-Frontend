import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './VerificationPopup.css';

const VerificationPopup = ({ isOpen, onClose, result, onRetry }) => {
  if (!isOpen) return null;

  const isExistingUser = result?.type === 'existing';
  const isNewUser = result?.type === 'new';
  const isError = result?.type === 'error';

  const handleButtonClick = () => {
    if (isError && onRetry) {
      onRetry()
    } else {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="verification-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Popup */}
          <motion.div
            className={`verification-popup ${result?.type}`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", duration: 0.4 }}
          >
            {/* Title */}
            <h2 className="verification-title">
              {isExistingUser && 'Already Verified'}
              {isNewUser && 'New User'}
              {isError && 'Verification Failed'}
            </h2>

            {/* Message */}
            <p className="verification-message">
              {result?.message || 'Processing verification...'}
            </p>

            {/* Details for existing users */}
            {isExistingUser && result?.similarity && (
              <div className="verification-details">
                <div className="similarity-badge">
                  <span className="similarity-label">Match</span>
                  <span className="similarity-value">{Math.round(result.similarity * 100)}%</span>
                </div>
                <div className="status-badge existing">
                  <span className="status-label">Status</span>
                  <span className="status-value">Vector Found</span>
                </div>
              </div>
            )}

            {/* Details for new user */}
            {isNewUser && (
              <div className="verification-details single">
                <div className="status-badge new">
                  <span className="status-label">Status</span>
                  <span className="status-value">Vector Stored</span>
                </div>
              </div>
            )}

            {/* Action Button */}
            <button 
              className="verification-button"
              onClick={handleButtonClick}
            >
              {isError ? 'Retry Scan' : 'Continue'}
            </button>

            {/* Scan Lines Effect */}
            <div className="scan-lines"></div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default VerificationPopup;
