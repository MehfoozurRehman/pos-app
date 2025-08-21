import { Button } from '@renderer/components/ui/button';
import { useNavigate } from 'react-router';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-4 items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">404 - Not Found</h1>
      <Button variant="outline" className="ml-4" onClick={() => navigate(-1)}>
        Go Back
      </Button>
    </div>
  );
}
