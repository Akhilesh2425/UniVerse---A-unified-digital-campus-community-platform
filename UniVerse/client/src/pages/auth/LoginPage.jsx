import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/authApi';
import {
  Mail,
  Lock,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  X,
  RefreshCw,
} from 'lucide-react';
import Spinner from '../../components/common/Spinner';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [otpStep, setOtpStep] = useState(1); 
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [simulatedInfo, setSimulatedInfo] = useState(null);

  const destination = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await login(formData);
      navigate(destination, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForgotModal = () => {
    setResetEmail(formData.email || '');
    setOtpStep(1);
    setOtpCode('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setOtpError('');
    setOtpSuccess('');
    setSimulatedInfo(null);
    setForgotModalOpen(true);
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    const cleanEmail = resetEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setOtpError('Please enter a valid campus email address (e.g. student@universe.edu).');
      return;
    }
    try {
      setOtpLoading(true);
      setOtpError('');
      setSimulatedInfo(null);
      setOtpCode(''); 
      const res = await authApi.forgotPassword({ email: cleanEmail });
      setOtpStep(2);
      if (res.simulated && res.simulatedOtp) {
        setSimulatedInfo({ code: res.simulatedOtp });
        setOtpSuccess('Verification code generated successfully!');
      } else {
        setOtpSuccess(res.message || '6-digit verification code sent to your campus email!');
      }
    } catch (err) {
      setOtpError(err.message || 'Failed to send OTP. Please check your email.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const cleanEmail = resetEmail.trim().toLowerCase();
    const cleanOtp = otpCode.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setOtpError('Please enter the 6-digit code received in your email.');
      return;
    }
    try {
      setOtpLoading(true);
      setOtpError('');
      const res = await authApi.verifyOtp({ email: cleanEmail, otp: cleanOtp });
      setResetToken(res.resetToken || res.verificationToken);
      setOtpStep(3);
      setOtpSuccess('Code verified! Please create a new secure password.');
    } catch (err) {
      setOtpError(err.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const cleanEmail = resetEmail.trim().toLowerCase();
    if (!newPassword || newPassword.length < 6) {
      setOtpError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setOtpError('Passwords do not match.');
      return;
    }
    try {
      setOtpLoading(true);
      setOtpError('');
      const res = await authApi.resetPassword({
        email: cleanEmail,
        resetToken,
        newPassword,
      });
      setFormData((prev) => ({ ...prev, email: cleanEmail, password: '' }));
      setForgotModalOpen(false);
      setErrorMessage('');
      alert(res.message || 'Password reset successful! Please log in with your new password.');
    } catch (err) {
      setOtpError(err.message || 'Failed to reset password.');
    } finally {
      setOtpLoading(false);
    }
  };

  const fillCredentials = (email, pass) => {
    setFormData({ email, password: pass });
    setErrorMessage('');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-20 h-20 rounded-2xl bg-white dark:bg-white p-1.5 shadow-md border border-slate-200/80 dark:border-slate-700 items-center justify-center mb-4 transition-transform hover:scale-105">
            <img
              src="/logo.jpeg"
              alt="UniVerse Official Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-extrabold text-navy-900 dark:text-white tracking-tight">
            Sign In to <span className="text-brand-600 dark:text-brand-400">UniVerse</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            A unified digital campus community platform for students, clubs, and staff
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/40 border border-slate-100 dark:border-slate-800 p-8 transition-colors">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-rose-800 dark:text-rose-200 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Campus Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="student@universe.edu"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleOpenForgotModal}
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-white font-semibold bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-600/20 transition flex items-center justify-center gap-2 disabled:opacity-60 text-sm"
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="border-white" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In to UniVerse</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-2.5 text-center flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-500" /> Quick Evaluation Credentials
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin@universe.edu', 'AdminSecure2026!')}
                className="py-1.5 px-2 bg-slate-50 dark:bg-slate-800/70 hover:bg-brand-50 dark:hover:bg-brand-950/50 border border-slate-200 dark:border-slate-700 hover:border-brand-200 dark:hover:border-brand-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition text-center"
              >
                Fill Main Admin
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('student@universe.edu', 'StudentSecure2026!')}
                className="py-1.5 px-2 bg-slate-50 dark:bg-slate-800/70 hover:bg-brand-50 dark:hover:bg-brand-950/50 border border-slate-200 dark:border-slate-700 hover:border-brand-200 dark:hover:border-brand-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition text-center"
              >
                Fill Demo Student
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          Don't have an account yet?{' '}
          <Link
            to="/register"
            className="font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 underline underline-offset-4"
          >
            Create student profile
          </Link>
        </p>
      </div>

      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <button
              type="button"
              onClick={() => setForgotModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 flex items-center justify-center mx-auto mb-3">
              <KeyRound className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center">
              {otpStep === 1 && 'Reset Password'}
              {otpStep === 2 && 'Enter 6-Digit OTP'}
              {otpStep === 3 && 'Create New Password'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1 mb-5">
              {otpStep === 1 && 'Enter your registered campus email to receive a secure verification code.'}
              {otpStep === 2 && `Enter the 6-digit code sent to ${resetEmail}. Code is valid for 5 minutes.`}
              {otpStep === 3 && 'Choose a new password to restore access to your account.'}
            </p>

            {otpError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{otpError}</span>
              </div>
            )}

            {otpSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{otpSuccess}</span>
              </div>
            )}

            {otpStep === 1 && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Campus Email
                    </label>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="text-slate-400">Quick fill:</span>
                      <button
                        type="button"
                        onClick={() => { setResetEmail('student@universe.edu'); setOtpError(''); }}
                        className="text-brand-600 dark:text-brand-400 hover:underline font-semibold"
                      >
                        Student
                      </button>
                      <span className="text-slate-300 dark:text-slate-700">|</span>
                      <button
                        type="button"
                        onClick={() => { setResetEmail('admin@universe.edu'); setOtpError(''); }}
                        className="text-brand-600 dark:text-brand-400 hover:underline font-semibold"
                      >
                        Admin
                      </button>
                    </div>
                  </div>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="student@universe.edu"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={otpLoading}
                  className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {otpLoading ? <Spinner size="sm" className="border-white" /> : 'Send Verification OTP'}
                </button>
              </form>
            )}

            {otpStep === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {simulatedInfo && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-2">
                    <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                      <span>Local Simulation Mode (SMTP Not Configured)</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300/90">
                      Real emails cannot be delivered to your inbox because SMTP credentials are not configured in <code className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded font-mono">server/.env</code>.
                    </p>
                    <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/60">
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Your Verification Code:</span>
                      <span className="font-mono font-black text-base tracking-widest text-brand-600 dark:text-brand-400 px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800">
                        {simulatedInfo.code}
                      </span>
                    </div>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 text-center">
                      Type the 6-digit code above into the box below to test password recovery.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center font-mono text-lg tracking-widest focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={otpLoading}
                  className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {otpLoading ? <Spinner size="sm" className="border-white" /> : 'Verify Code'}
                </button>
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={otpLoading}
                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-300 flex items-center justify-center gap-1 mx-auto"
                  >
                    <RefreshCw className="w-3 h-3" /> Resend Code
                  </button>
                </div>
              </form>
            )}

            {otpStep === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-slate-400"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={otpLoading}
                  className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {otpLoading ? <Spinner size="sm" className="border-white" /> : 'Set New Password & Sign In'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;