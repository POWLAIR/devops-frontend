import RegisterForm from '@/components/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center text-slate-800 dark:text-slate-100">Inscription</h1>
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 shadow-xl">
        <RegisterForm />
      </div>
    </div>
  );
}

