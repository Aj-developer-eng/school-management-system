import { Head, useForm } from '@inertiajs/react';
import { GraduationCap } from 'lucide-react';

export default function RegisterStudent() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        program: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register_student.store'));
    };

    return (
        <>
            <Head title="Register Student" />
            <div className="min-h-screen bg-white font-sans text-gray-900">
                <header className="border-b border-gray-200/60 bg-white/80 backdrop-blur-xl">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                        <a href="/" className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-gold">
                                <GraduationCap className="h-5 w-5" />
                            </span>
                            <span className="font-serif text-xl font-semibold tracking-tight">Register</span>
                        </a>
                    </div>
                </header>
                <main className="mx-auto max-w-lg px-6 py-16">
                    <h1 className="text-3xl font-semibold tracking-tight">Student Registration</h1>
                    <p className="mt-2 text-gray-500">Submit your details for approval.</p>
                    <form onSubmit={submit} className="mt-8 space-y-4">
                        <div>
                            <label className="block text-sm font-medium">Name</label>
                            <input value={data.name} onChange={(e) => setData('name', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300" />
                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Email</label>
                            <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300" />
                            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Phone</label>
                            <input value={data.phone} onChange={(e) => setData('phone', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300" />
                            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Program</label>
                            <input value={data.program} onChange={(e) => setData('program', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300" />
                            {errors.program && <p className="mt-1 text-sm text-red-600">{errors.program}</p>}
                        </div>
                        <button disabled={processing} className="rounded-full bg-navy px-6 py-2 text-white">Submit</button>
                    </form>
                </main>
            </div>
        </>
    );
}
