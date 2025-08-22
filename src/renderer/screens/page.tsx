import { LoginForm } from '@/components/login-form';
import { ModeToggle } from '@renderer/components/mode-toggle';

export default function Login() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <div className="w-full max-w-sm">
        <LoginForm />
        <button
          onClick={async () => {
            const notes = await window.api.db.get('notes');
            console.warn(notes);
          }}
        >
          get notes
        </button>
        <button
          onClick={async () => {
            await window.api.db.create('notes', {
              id: '1',
              title: 'hello',
              content: 'Welcome to the POS App!',
              createdAt: new Date().toISOString(),
            });
          }}
        >
          create note
        </button>
        <button
          onClick={async () => {
            const updated = await window.api.db.update('notes', '1', {
              title: 'test',
            });
            console.warn('updated', updated);
          }}
        >
          update note
        </button>
        <button
          onClick={async () => {
            const removed = await window.api.db.delete('notes', '1');
            console.warn('removed', removed);
          }}
        >
          delete note
        </button>
      </div>
    </div>
  );
}
