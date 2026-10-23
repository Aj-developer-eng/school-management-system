import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';

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
            <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Student Registration</h2>}>
                <div className="mx-auto max-w-lg">
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <InputLabel for="name" value="Name" />
                            <TextInput id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} className="mt-1 block w-full" />
                            <InputError message={errors.name} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel for="email" value="Email" />
                            <TextInput id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className="mt-1 block w-full" />
                            <InputError message={errors.email} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel for="phone" value="Phone" />
                            <TextInput id="phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} className="mt-1 block w-full" />
                            <InputError message={errors.phone} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel for="program" value="Program" />
                            <TextInput id="program" value={data.program} onChange={(e) => setData('program', e.target.value)} className="mt-1 block w-full" />
                            <InputError message={errors.program} className="mt-1" />
                        </div>
                        <PrimaryButton disabled={processing}>Submit</PrimaryButton>
                    </form>
                </div>
            </AuthenticatedLayout>
        </>
    );
}
