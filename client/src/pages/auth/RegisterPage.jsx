import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  BookOpen,
  GraduationCap,
  Heart,
} from 'lucide-react';
import toast from 'react-hot-toast';

// FIXED: renamed Redux thunk import
import { register as registerUser } from '../../features/auth/authSlice';

import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const schema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm: z.string(),
    role: z.enum(['student', 'teacher', 'parent']),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

const ROLES = [
  {
    value: 'student',
    label: 'Student',
    description: 'Track sessions, manage tasks, join classes',
    icon: GraduationCap,
    color: 'text-primary-600',
    bg: 'bg-primary-50',
    border: 'border-primary-300',
  },
  {
    value: 'teacher',
    label: 'Teacher',
    description: 'Create classes, assign work, view performance',
    icon: BookOpen,
    color: 'text-success-600',
    bg: 'bg-success-50',
    border: 'border-success-300',
  },
  {
    value: 'parent',
    label: 'Parent',
    description: "Monitor your child's progress and reports",
    icon: Heart,
    color: 'text-warning-600',
    bg: 'bg-warning-50',
    border: 'border-warning-300',
  },
];

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error, user } = useSelector((state) => state.auth);

  const [showPass, setShowPass] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  // React Hook Form register renamed safely
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      role: '',
    },
  });

  useEffect(() => {
    if (user?.role === 'student') {
      navigate('/dashboard', { replace: true });
    } else if (user?.role === 'teacher') {
      navigate('/dashboard', { replace: true });
    } else if (user?.role === 'parent') {
      navigate('/parent-dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setValue('role', role, { shouldValidate: true });
  };

  const onSubmit = async (data) => {
    const { confirm, ...payload } = data;

    const result = await dispatch(registerUser(payload));

    if (registerUser.fulfilled.match(result)) {
      toast.success('Account created successfully!');

      const role = result.payload.user.role;

      if (role === 'parent') {
        navigate('/parent-dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } else {
      toast.error(result.payload || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
            <BookOpen size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">StudySync</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            Create your account
          </h2>

          <p className="text-slate-500 text-sm mb-6">
            Already have one?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-700"
            >
              Sign in
            </Link>
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Role Selector */}
            <div>
              <label className="label">I am a</label>

              <div className="grid grid-cols-3 gap-3">
                {ROLES.map((role) => {
                  const Icon = role.icon;
                  const active = selectedRole === role.value;

                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => handleRoleSelect(role.value)}
                      className={`
                        flex flex-col items-center gap-2 p-3 rounded-xl
                        border-2 transition-all duration-150 text-center
                        ${
                          active
                            ? `${role.border} ${role.bg}`
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }
                      `}
                    >
                      <Icon
                        size={22}
                        className={active ? role.color : 'text-slate-400'}
                      />

                      <div>
                        <p
                          className={`text-xs font-semibold ${
                            active ? role.color : 'text-slate-700'
                          }`}
                        >
                          {role.label}
                        </p>

                        <p className="text-2xs text-slate-400 mt-0.5 leading-tight">
                          {role.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <input
                type="hidden"
                {...register('role')}
                value={selectedRole || ''}
              />

              {errors.role && (
                <p className="error-text">{errors.role.message}</p>
              )}
            </div>

            {/* Full Name */}
            <Input
              label="Full name"
              type="text"
              placeholder="Alex Johnson"
              error={errors.name?.message}
              leftIcon={<User size={16} />}
              required
              {...register('name')}
            />

            {/* Email */}
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              leftIcon={<Mail size={16} />}
              required
              {...register('email')}
            />

            {/* Password */}
            <Input
              label="Password"
              type={showPass ? 'text' : 'password'}
              placeholder="Min. 6 characters"
              error={errors.password?.message}
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPass((prev) => !prev)}
                  className="pointer-events-auto text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              required
              {...register('password')}
            />

            {/* Confirm Password */}
            <Input
              label="Confirm password"
              type={showPass ? 'text' : 'password'}
              placeholder="Repeat password"
              error={errors.confirm?.message}
              leftIcon={<Lock size={16} />}
              required
              {...register('confirm')}
            />

            {/* Error Box */}
            {error && (
              <div className="bg-danger-50 border border-danger-200 rounded-lg px-4 py-3">
                <p className="text-sm text-danger-700">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button type="submit" fullWidth size="lg" loading={loading}>
              Create account
            </Button>

            {/* Terms */}
            <p className="text-xs text-slate-400 text-center leading-relaxed">
              By creating an account you agree to our{' '}
              <a href="#" className="underline text-slate-500">
                Terms
              </a>{' '}
              and{' '}
              <a href="#" className="underline text-slate-500">
                Privacy Policy
              </a>
              .
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
